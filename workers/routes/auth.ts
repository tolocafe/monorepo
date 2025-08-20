import { RequestOtpSchema, VerifyOtpSchema } from '@common/schemas'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

import { authenticate, signJwt } from '../utils/jwt'
import { generateOtp, storeOtp, verifyOtp } from '../utils/otp'
import { api, sendSms } from '../utils/poster'

import type { Bindings } from '../types'

type SessionRecord = { createdAt: number; name: string; token: string }

const isSessionRecord = (value: unknown): value is SessionRecord =>
	typeof value === 'object' &&
	value !== null &&
	'createdAt' in value &&
	'name' in value &&
	'token' in value

const auth = new Hono<{ Bindings: Bindings }>()
	.post('/request-otp', async (context) => {
		const { email, name, phone } = RequestOtpSchema.parse(
			await context.req.json(),
		)

		const existingClient = await api.clients.getClient(
			context.env.POSTER_TOKEN,
			phone,
		)

		if (!existingClient) {
			await api.clients.createClient(context.env.POSTER_TOKEN, {
				client_groups_id_client: 1,
				client_name: name ?? 'anon',
				email,
				phone,
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

		const client = await api.clients.getClient(context.env.POSTER_TOKEN, phone)

		if (!client) throw new HTTPException(404, { message: 'Client not found' })

		const { client_id: clientId } = client

		const [token, sessionsRaw] = await Promise.all([
			signJwt(clientId, context.env.JWT_SECRET),
			context.env.KV_SESSIONS.get(clientId),
		])

		const parsedSessionsUnknown: unknown = sessionsRaw
			? JSON.parse(sessionsRaw)
			: []
		const sessions: SessionRecord[] = Array.isArray(parsedSessionsUnknown)
			? parsedSessionsUnknown.filter((record) => isSessionRecord(record))
			: []

		await Promise.all([
			context.env.KV_SESSIONS.put(
				clientId,
				JSON.stringify([
					...sessions,
					{ createdAt: Date.now(), name: sessionName, token },
				]),
			),
			client.client_groups_id === '0'
				? api.clients.updateClient(context.env.POSTER_TOKEN, clientId, {
						client_groups_id_client: 3,
					})
				: Promise.resolve(),
		])

		// For web: set HttpOnly cookie. For native: client uses token from body
		const isWeb = (context.req.header('User-Agent') ?? '').includes('Mozilla')

		const responseBody = { client, token }

		if (isWeb) {
			setCookie(context, 'tolo_session', token, {
				httpOnly: true,
				// 1 year
				maxAge: 60 * 60 * 24 * 365,
				path: '/api',
				priority: 'High',
				sameSite: isTest ? 'None' : 'Lax',
				secure: !isTest,
			})
		}

		return context.json(responseBody)
	})
	.get('/self', async (c) => {
		const clientId = await authenticate(c, c.env.JWT_SECRET)

		const client = await api.clients.getClientById(c.env.POSTER_TOKEN, clientId)

		if (!client) throw new HTTPException(404, { message: 'Client not found' })

		return c.json(client)
	})
	.get('/self/sessions', async (c) => {
		const clientId = await authenticate(c, c.env.JWT_SECRET)

		const sessionsRaw = await c.env.KV_SESSIONS.get(clientId.toString())

		const parsedUnknown: unknown = sessionsRaw ? JSON.parse(sessionsRaw) : []
		const sessions: SessionRecord[] = Array.isArray(parsedUnknown)
			? parsedUnknown.filter((record) => isSessionRecord(record))
			: []

		return c.json(sessions)
	})

export default auth
