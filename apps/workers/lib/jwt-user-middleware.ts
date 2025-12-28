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
	jwt: {
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
 * @param options.required - If true, throws 401 when token is missing/invalid. Default: false
 * @returns Hono middleware
 *
 * @example
 * // Global usage (optional auth for public/private routes)
 * app.use(jwtUserMiddleware())
 *
 * @example
 * // Route-specific usage (required auth)
 * const protectedRoute = new Hono<{ Bindings: Bindings; Variables: JwtUserVariables }>()
 *   .use(jwtUserMiddleware({ required: true }))
 *   .get('/', (c) => {
 *     const userId = c.get('jwt').userId
 *     return c.json({ userId })
 *   })
 *
 * @example
 * // Access user data in route handlers
 * app.get('/profile', (c) => {
 *   const { userId, payload, token } = c.get('jwt')
 *   return c.json({ userId, email: payload.email })
 * })
 */
export function jwtUserMiddleware(options?: { required?: boolean }) {
	const required = options?.required ?? false

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
			if (required) {
				throw new HTTPException(401, { message: 'Unauthorized' })
			}
			return next()
		}

		const [clientId, payload] = await verifyJwt(token, context.env.JWT_SECRET)

		if (!clientId || !payload) {
			if (required) {
				throw new HTTPException(403, { message: 'Unauthorized' })
			}
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
