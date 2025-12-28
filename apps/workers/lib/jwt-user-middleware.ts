import * as Sentry from '@sentry/cloudflare'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import type { JWTPayload } from 'jose'

import { extractToken, verifyJwt } from '../utils/jwt'
import { identifyPostHogUser } from '../utils/posthog'

import type { Bindings } from '../types'

export type JwtUserVariables = {
	jwt?: {
		payload: JWTPayload
		token: string
		userId: number
	}
}

/**
 * Middleware for JWT authentication with Sentry and PostHog integration
 *
 * Extracts JWT token from query params, Authorization header, or cookies,
 * verifies the token, and sets user context in Sentry and PostHog.
 *
 * Use globally to enable optional authentication across all routes.
 * For routes requiring authentication, use the `requireAuth` helper.
 *
 * @example
 * // Global usage (optional auth for all routes)
 * app.use(jwtUserMiddleware())
 *
 * @example
 * // Protected route requiring authentication
 * app.get('/profile', (c) => {
 *   const { userId } = requireAuth(c)
 *   return c.json({ userId })
 * })
 */
export function jwtUserMiddleware() {
	return createMiddleware<{
		Bindings: Bindings
		Variables: JwtUserVariables
	}>(async (context, next) => {
		const token =
			context.req.query('authenticationToken') ||
			extractToken(context.req.header('Authorization')) ||
			getCookie(context, 'tolo_session') ||
			null

		if (!token) {
			return next()
		}

		const [clientId, payload] = await verifyJwt(token, context.env.JWT_SECRET)

		if (!clientId || !payload) {
			return next()
		}

		const userId = Number.parseInt(clientId, 10)

		const userEmail = 'email' in payload ? (payload.email as string) : undefined
		const userName = 'name' in payload ? (payload.name as string) : undefined
		const userPhone = 'phone' in payload ? (payload.phone as string) : undefined

		Sentry.setUser({
			email: userEmail,
			id: userId.toString(),
			name: userName,
			phone: userPhone,
		})

		identifyPostHogUser(
			context as unknown as Context<{ Bindings: Bindings }>,
			userId.toString(),
			{
				email: userEmail,
				name: userName,
				phone: userPhone,
			},
		)

		context.set('jwt', {
			payload,
			token,
			userId,
		})

		return next()
	})
}

/**
 * Helper to require authentication in a route handler
 *
 * Throws 401 Unauthorized if user is not authenticated
 *
 * @example
 * app.get('/profile', (c) => {
 *   const { userId, payload } = requireAuth(c)
 *   return c.json({ userId })
 * })
 */
export function requireAuth(
	context: Context<{ Bindings: Bindings; Variables: JwtUserVariables }>,
) {
	const jwt = context.get('jwt')

	if (!jwt) {
		throw new HTTPException(401, { message: 'Unauthorized' })
	}

	return jwt
}
