import { startSpan } from '@sentry/cloudflare'
import type { ClientData } from '@tolo/common/api'
import { RequestOtpSchema, VerifyOtpSchema } from '@tolo/common/schemas'
import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import type { CookieOptions } from 'hono/utils/cookie'

import type { Bindings } from '@/types'
import { trackServerEvent } from '@/utils/analytics'
import { defaultJsonHeaders } from '@/utils/headers'
import {
	authenticate,
	DEFAULT_AUTH_TOKEN_VALIDITY_IN_SECONDS,
	signJwt,
} from '@/utils/jwt'
import { generateOtp, storeOtp, verifyOtp } from '@/utils/otp'
import { posterApi, sendSms } from '@/utils/poster'
import { trackEvent } from '@/utils/posthog'

type SessionRecord = { createdAt: number; name: string; token: string }

/**
 * Build user properties for PostHog identification
 */
function buildUserProperties(client: ClientData) {
	return {
		birthday: client.birthday,
		created_at: client.date_activale,
		email: client.email,
		first_name: client.firstname,
		group_id: client.client_groups_id,
		group_name: client.client_groups_name,
		last_name: client.lastname,
		name: client.name,
		phone: client.phone,
	}
}

const UNVERIFIED_CLIENT_GROUP_ID = '1'
const VERIFIED_CLIENT_GROUP_ID = 3

const isSessionRecord = (value: unknown): value is SessionRecord =>
	typeof value === 'object' &&
	value !== null &&
	'createdAt' in value &&
	'name' in value &&
	'token' in value

const getCookieOptions = (options: {
	expiresIn?: number
	isTest?: boolean
	origin: string
}) => {
	const isLocalhost = options.origin
		? options.origin.includes('localhost')
		: false

	// Cross-origin requests (localhost to remote) require SameSite=None + Secure
	// Modern browsers treat localhost as a secure context, so Secure cookies work
	// Same-origin requests can use Strict for better security
	const isCrossOrigin = isLocalhost || options.isTest

	return {
		httpOnly: true,
		maxAge: options.expiresIn ?? DEFAULT_AUTH_TOKEN_VALIDITY_IN_SECONDS,
		path: '/api',
		sameSite: isCrossOrigin ? 'None' : 'Strict',
		secure: true,
	} satisfies CookieOptions
}

const auth = new Hono<{ Bindings: Bindings }>()
	.post('/request-otp', async (context) => {
		const { birthdate, email, name, phone } = RequestOtpSchema.parse(
			await context.req.json(),
		)

		const existingClient = await posterApi.clients.getClient(
			context.env.POSTER_TOKEN,
			phone,
		)

		if (!existingClient) {
			if (!name) {
				return context.json(
					{ error: 'Some fields are required', fields: [{ name: 'name' }] },
					400,
				)
			}

			const nextClientId = await posterApi.clients.createClient(
				context.env.POSTER_TOKEN,
				{
					birthday: birthdate,
					client_groups_id_client: 1,
					client_name: name,
					email,
					phone,
				},
			)

			// Track signup with both GA4 and PostHog
			await Promise.all([
				trackServerEvent(context, {
					eventName: 'sign_up',
					userData: {
						emailAddress: email,
						firstName: name,
						phoneNumber: phone,
					},
					userId: nextClientId.toString(),
				}),
				trackEvent(context, {
					distinctId: nextClientId.toString(),
					event: 'auth:user_signup',
					properties: {
						signup_method: 'phone',
					},
					userProperties: {
						created_at: new Date().toISOString(),
						email,
						first_name: name,
						is_team_member: false,
						name,
						phone,
					},
				}),
			])
		}

		const code = generateOtp()

		await Promise.all([
			storeOtp(context.env.KV_OTP, phone, code),
			sendSms(
				context.env.POSTER_TOKEN,
				phone,
				`[TOLO] Tu código de verificación es ${code}`,
			),
		])

		return context.json({ success: true })
	})
	.post('/verify-otp', async (context) => {
		const { code, phone, sessionName } = VerifyOtpSchema.parse(
			await context.req.json(),
		)

		const { isTest } = await verifyOtp(context.env.KV_OTP, phone, code)

		const posterClient = await posterApi.clients.getClient(
			context.env.POSTER_TOKEN,
			phone,
		)

		if (!posterClient) {
			throw new HTTPException(403, { message: 'Forbidden' })
		}

		const { client_id: clientId } = posterClient

		const [token, sessionsRaw] = await Promise.all([
			signJwt(
				{
					email: posterClient.email,
					name: posterClient.name ?? posterClient.firstname,
					phone: posterClient.phone,
					sub: clientId,
				},
				context.env.JWT_SECRET,
			),
			startSpan({ name: 'KV_SESSIONS.get' }, () =>
				context.env.KV_SESSIONS.get(clientId),
			),
		])

		const parsedSessionsUnknown: unknown = sessionsRaw
			? JSON.parse(sessionsRaw)
			: []
		const sessions: SessionRecord[] = Array.isArray(parsedSessionsUnknown)
			? parsedSessionsUnknown.filter((record) => isSessionRecord(record))
			: []

		await Promise.all([
			// GA4 tracking
			trackServerEvent(context, {
				eventName: 'login',
				userData: {
					emailAddress: posterClient.email,
					firstName: posterClient.firstname,
					lastName: posterClient.lastname,
					phoneNumber: posterClient.phone,
				},
				userId: clientId,
			}),
			// PostHog tracking with full user properties
			trackEvent(context, {
				distinctId: clientId,
				event: 'auth:user_login',
				properties: {
					login_method: 'otp',
					session_name: sessionName,
				},
				userProperties: buildUserProperties(posterClient),
			}),
			startSpan({ name: 'KV_SESSIONS.put' }, () =>
				context.env.KV_SESSIONS.put(
					clientId,
					JSON.stringify([
						...sessions,
						{ createdAt: Date.now(), name: sessionName, token },
					]),
				),
			),
			posterClient.client_groups_id === UNVERIFIED_CLIENT_GROUP_ID
				? posterApi.clients.updateClient(
						context.env.POSTER_TOKEN,
						Number(clientId),
						{
							client_groups_id_client: VERIFIED_CLIENT_GROUP_ID,
						},
					)
				: Promise.resolve(),
		])

		// For web: set HttpOnly cookie. For native: client uses token from body
		const isWeb = (context.req.header('User-Agent') ?? '').includes('Mozilla')

		const responseBody = { client: posterClient, token }

		if (isWeb) {
			setCookie(
				context,
				'tolo_session',
				token,
				getCookieOptions({
					expiresIn: DEFAULT_AUTH_TOKEN_VALIDITY_IN_SECONDS,
					isTest,
					origin: context.req.header('Origin') ?? '',
				}),
			)
		}

		return context.json(responseBody)
	})
	.get('/sessions', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const sessionsRaw = await startSpan({ name: 'KV_SESSIONS.get' }, () =>
			context.env.KV_SESSIONS.get(clientId.toString()),
		)

		const parsedUnknown: unknown = sessionsRaw ? JSON.parse(sessionsRaw) : []

		const fullSessions = Array.isArray(parsedUnknown)
			? parsedUnknown.filter((record) => isSessionRecord(record))
			: []

		const sessions = fullSessions.map(({ token: _token, ...session }) => ({
			...session,
		}))

		return context.json(sessions, 200)
	})
	.get('/self', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const client = await posterApi.clients.getClientById(
			c.env.POSTER_TOKEN,
			clientId,
		)

		if (!client) throw new HTTPException(404, { message: 'Client not found' })

		return c.json(client, 200, defaultJsonHeaders)
	})
	.get('/self/sessions', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const sessionsRaw = await startSpan({ name: 'KV_SESSIONS.get' }, () =>
			context.env.KV_SESSIONS.get(clientId.toString()),
		)

		const parsedUnknown: unknown = sessionsRaw ? JSON.parse(sessionsRaw) : []
		const sessions: SessionRecord[] = Array.isArray(parsedUnknown)
			? parsedUnknown.filter((record) => isSessionRecord(record))
			: []

		return context.json(sessions)
	})
	.post('/sign-out', async (context) => {
		const [clientId, , token] = await authenticate(
			context,
			context.env.JWT_SECRET,
		)

		const sessionsRaw = await startSpan({ name: 'KV_SESSIONS.get' }, () =>
			context.env.KV_SESSIONS.get(clientId.toString()),
		)

		const parsedSessionsUnknown: unknown = sessionsRaw
			? JSON.parse(sessionsRaw)
			: []
		const sessions: SessionRecord[] = Array.isArray(parsedSessionsUnknown)
			? parsedSessionsUnknown.filter((record) => isSessionRecord(record))
			: []

		// Clear session and track logout
		await Promise.all([
			startSpan({ name: 'KV_SESSIONS.put' }, () =>
				context.env.KV_SESSIONS.put(
					clientId.toString(),
					JSON.stringify(sessions.filter((session) => session.token !== token)),
				),
			),
			trackEvent(context, {
				distinctId: clientId.toString(),
				event: 'auth:user_logout',
			}),
		])

		// For web, clear the HttpOnly cookie
		const isWeb = (context.req.header('User-Agent') ?? '').includes('Mozilla')

		if (isWeb) {
			deleteCookie(
				context,
				'tolo_session',
				getCookieOptions({
					expiresIn: DEFAULT_AUTH_TOKEN_VALIDITY_IN_SECONDS,
					origin: context.req.header('Origin') ?? '',
				}),
			)
		}

		return context.json({ success: true })
	})

export default auth
