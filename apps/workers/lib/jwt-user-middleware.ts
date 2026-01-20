import * as Sentry from '@sentry/cloudflare'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { JWTPayload } from 'jose'

import type { Bindings } from '@/types'
import { extractToken, verifyJwt } from '@/utils/jwt'

export type JwtUserVariables = {
	jwt: {
		verify: () => {
			payload: JWTPayload
			token: string
			userId: number
		}
	}
}

/**
 * Middleware for JWT authentication with Sentry and PostHog integration
 */
export const jwtUserMiddleware = createMiddleware<{
	Bindings: Bindings
	Variables: JwtUserVariables
}>(async (context, next) => {
	const token =
		context.req.query('authenticationToken') ||
		extractToken(context.req.header('Authorization')) ||
		getCookie(context, 'tolo_session') ||
		null

	let authResult: {
		payload: JWTPayload
		token: string
		userId: number
	} | null = null

	if (token) {
		const [clientId, payload] = await verifyJwt(token, context.env.JWT_SECRET)

		if (clientId && payload) {
			const userId = Number(clientId)
			const userEmail = 'email' in payload ? (payload.email as string) : null
			const userName = 'name' in payload ? (payload.name as string) : null
			const userPhone = 'phone' in payload ? (payload.phone as string) : null

			Sentry.setUser({
				// oxlint-disable-next-line no-undefined
				email: userEmail ?? undefined,
				id: userId.toString(),
				name: userName,
				phone: userPhone,
			})

			authResult = { payload, token, userId }
		}
	}

	context.set('jwt', {
		verify: () => {
			if (!authResult) {
				throw new HTTPException(401, { message: 'Unauthorized' })
			}
			return authResult
		},
	})

	return next()
})
