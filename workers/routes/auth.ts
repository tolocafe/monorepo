import { RequestOtpSchema, VerifyOtpSchema } from '@common/schemas'
import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

import { trackServerEvent } from '../utils/analytics'
import { authenticate, signJwt } from '../utils/jwt'
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

const getCookieOptions = (isTest: boolean) =>
	({
		httpOnly: true,
		// 1 year
		maxAge: 60 * 60 * 24 * 365,
		path: '/api',
		priority: 'High',
		sameSite: isTest ? 'None' : 'Lax',
		secure: !isTest,
	}) as const

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

			await trackServerEvent(context.env, {
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

		const posterClient = await api.clients.getClient(
			context.env.POSTER_TOKEN,
			phone,
		)

		if (!posterClient)
			throw new HTTPException(404, { message: 'Client not found' })

		const { client_id: clientId } = posterClient

		await trackServerEvent(context.env, {
			eventName: 'login',
			userData: {
				emailAddress: posterClient.email,
				firstName: posterClient.firstname,
				lastName: posterClient.lastname,
				phoneNumber: posterClient.phone,
			},
			userId: clientId,
		})

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
			context.env.KV_SESSIONS.get(clientId),
		])

		const parsedSessionsUnknown: unknown = sessionsRaw
			? JSON.parse(sessionsRaw)
			: []
		const sessions: SessionRecord[] = Array.isArray(parsedSessionsUnknown)
			? parsedSessionsUnknown.filter((record) => isSessionRecord(record))
			: []

		// eslint-disable-next-line no-console
		console.log('posterClient', posterClient)

		await Promise.all([
			context.env.KV_SESSIONS.put(
				clientId,
				JSON.stringify([
					...sessions,
					{ createdAt: Date.now(), name: sessionName, token },
				]),
			),
			posterClient.client_groups_id === UNVERIFIED_CLIENT_GROUP_ID
				? api.clients.updateClient(context.env.POSTER_TOKEN, clientId, {
						client_groups_id_client: VERIFIED_CLIENT_GROUP_ID,
					})
				: Promise.resolve(),
		])

		// For web: set HttpOnly cookie. For native: client uses token from body
		const isWeb = (context.req.header('User-Agent') ?? '').includes('Mozilla')

		const responseBody = { client: posterClient, token }

		if (isWeb) {
			setCookie(context, 'tolo_session', token, getCookieOptions(isTest))
		}

		return context.json(responseBody)
	})
	.get('/sessions', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const sessionsRaw = await c.env.KV_SESSIONS.get(clientId.toString())

		const parsedUnknown: unknown = sessionsRaw ? JSON.parse(sessionsRaw) : []

		const fullSessions = Array.isArray(parsedUnknown)
			? parsedUnknown.filter((record) => isSessionRecord(record))
			: []

		const sessions = fullSessions.map(({ token, ...session }) => ({
			...session,
		}))

		return c.json(sessions, 200)
	})
	.get('/self', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const client = await api.clients.getClientById(c.env.POSTER_TOKEN, clientId)

		if (!client) throw new HTTPException(404, { message: 'Client not found' })

		return c.json(client)
	})
	.get('/self/sessions', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const sessionsRaw = await c.env.KV_SESSIONS.get(clientId.toString())

		const parsedUnknown: unknown = sessionsRaw ? JSON.parse(sessionsRaw) : []
		const sessions: SessionRecord[] = Array.isArray(parsedUnknown)
			? parsedUnknown.filter((record) => isSessionRecord(record))
			: []

		return c.json(sessions)
	})
	.post('/sign-out', async (context) => {
		const [clientId, , token] = await authenticate(
			context,
			context.env.JWT_SECRET,
		)

		const sessionsRaw = await context.env.KV_SESSIONS.get(clientId.toString())

		const parsedSessionsUnknown: unknown = sessionsRaw
			? JSON.parse(sessionsRaw)
			: []
		const sessions: SessionRecord[] = Array.isArray(parsedSessionsUnknown)
			? parsedSessionsUnknown.filter((record) => isSessionRecord(record))
			: []

		// Clear all sessions for this client
		await context.env.KV_SESSIONS.put(
			clientId.toString(),
			JSON.stringify(sessions.filter((session) => session.token !== token)),
		)

		// For web, clear the HttpOnly cookie
		const isWeb = (context.req.header('User-Agent') ?? '').includes('Mozilla')

		if (isWeb) {
			deleteCookie(context, 'tolo_session', getCookieOptions(false))
		}

		return context.json({ success: true })
	})

export default auth
