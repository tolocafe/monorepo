import { startSpan } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

import type { CookieOptions } from 'hono/utils/cookie'
import type { Context } from 'hono'

import { RequestOtpSchema, VerifyOtpSchema } from '~common/schemas'
import { defaultJsonHeaders } from '~workers/utils/headers'

import { trackServerEvent } from '../utils/analytics'
import {
	authenticate,
	DEFAULT_AUTH_TOKEN_VALIDITY_IN_SECONDS,
	signJwt,
} from '../utils/jwt'
import { generateOtp, storeOtp, verifyOtp } from '../utils/otp'
import { api, sendSms } from '../utils/poster'

import type { Bindings } from '../types'

type SessionRecord = { createdAt: number; name: string; token: string }

const UNVERIFIED_CLIENT_GROUP_ID = '1'
const VERIFIED_CLIENT_GROUP_ID = 3

const isSessionRecord = (value: unknown): value is SessionRecord =>
	typeof value === 'object' &&
	value !== null &&
	'createdAt' in value &&
	'name' in value &&
	'token' in value

/**
 * Determine if the request is from a web browser based on Origin and User-Agent headers
 * 
 * IMPORTANT: This is NOT a security mechanism and SHOULD NOT be used for authorization.
 * This is purely a UX convenience to decide whether to set HttpOnly cookies for browsers.
 * 
 * Security notes:
 * - User-Agent can be easily spoofed - this is acceptable here
 * - The authentication token is ALWAYS returned in the response body
 * - Native apps use the token from the response body with Bearer auth
 * - Web browsers benefit from HttpOnly cookies for XSS protection
 * - Both mechanisms are equally secure (cookies + Bearer tokens both validated via JWT)
 * 
 * If a malicious client spoofs User-Agent to get a cookie, they still need valid JWT
 * and the cookie won't help them since they can't extract it (HttpOnly).
 */
const isWebRequest = (context: Context): boolean => {
	const origin = context.req.header('Origin')
	const userAgent = context.req.header('User-Agent') ?? ''

	return (
		origin !== undefined &&
		(userAgent.includes('Mozilla') ||
			userAgent.includes('Chrome') ||
			userAgent.includes('Safari') ||
			userAgent.includes('Firefox') ||
			userAgent.includes('Edge'))
	)
}

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

		const existingClient = await api.clients.getClient(
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

			const nextClient = await api.clients.createClient(
				context.env.POSTER_TOKEN,
				{
					birthday: birthdate,
					client_groups_id_client: 1,
					client_name: name,
					email,
					phone,
				},
			)

			await trackServerEvent(context, {
				eventName: 'sign_up',
				userData: {
					emailAddress: email,
					firstName: name,
					phoneNumber: phone,
				},
				userId: nextClient.toString(),
			})
		}

		const code = generateOtp()

		const testPhoneNumbers = (context.env.TEST_PHONE_NUMBERS ?? '')
			.split(',')
			.filter(Boolean)

		await Promise.all([
			storeOtp(context.env.KV_OTP, phone, code, testPhoneNumbers),
			sendSms(
				{
					accessKeyId: context.env.AWS_ACCESS_KEY_ID,
					secretAccessKey: context.env.AWS_SECRET_ACCESS_KEY,
				},
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

		const testPhoneNumbers = (context.env.TEST_PHONE_NUMBERS ?? '')
			.split(',')
			.filter(Boolean)

		const { isTest } = await verifyOtp(
			context.env.KV_OTP,
			phone,
			code,
			testPhoneNumbers,
			context.env.TEST_OTP_CODE,
		)

		const posterClient = await api.clients.getClient(
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
				? api.clients.updateClient(
						context.env.POSTER_TOKEN,
						Number.parseInt(clientId, 10),
						{ client_groups_id_client: VERIFIED_CLIENT_GROUP_ID },
					)
				: Promise.resolve(),
		])

		// Set HttpOnly cookie for web clients that accept cookies
		const responseBody = { client: posterClient, token }

		if (isWebRequest(context)) {
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

		const sessions = fullSessions.map(({ token, ...session }) => ({
			...session,
		}))

		return context.json(sessions, 200)
	})
	.get('/self', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const client = await api.clients.getClientById(c.env.POSTER_TOKEN, clientId)

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

		// Clear all sessions for this client
		await startSpan({ name: 'KV_SESSIONS.put' }, () =>
			context.env.KV_SESSIONS.put(
				clientId.toString(),
				JSON.stringify(sessions.filter((session) => session.token !== token)),
			),
		)

		// Clear the HttpOnly cookie for web requests
		if (isWebRequest(context)) {
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
