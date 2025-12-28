import * as Sentry from '@sentry/cloudflare'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { JWTPayload } from 'jose'

import { extractToken, verifyJwt } from '../utils/jwt'

import type { Bindings } from '../types'

export type JwtUserVariables = {
	jwt: {
		payload: JWTPayload
		token: string
		userId: number
	}
}

/**
 * Middleware for JWT authentication with Sentry integration
 *
 * Extracts JWT token from query params, Authorization header, or cookies,
 * verifies the token, and sets user context in Sentry.
 *
 * @param options.required - If true, throws 401 when token is missing/invalid. Default: true
 * @returns Hono middleware
 *
 * @example
 * // Global usage (optional auth)
 * app.use(jwtUserMiddleware({ required: false }))
 *
 * @example
 * // Route-specific usage (required auth)
 * const protectedRoute = new Hono<{ Bindings: Bindings; Variables: JwtUserVariables }>()
 *   .use(jwtUserMiddleware())
 *   .get('/', (c) => {
 *     const userId = c.get('jwt').userId
 *     return c.json({ userId })
 *   })
 *
 * @example
 * // Access user data in route handlers
 * app.get('/profile', (c) => {
 *   const { userId, payload, token } = c.get('jwt')
 *   // User is already authenticated and Sentry context is set
 *   return c.json({ userId, email: payload.email })
 * })
 */
export function jwtUserMiddleware(options?: { required?: boolean }) {
	const required = options?.required ?? true

	return createMiddleware<{
		Bindings: Bindings
		Variables: JwtUserVariables
	}>(async (context, next) => {
		// Extract token from multiple sources (query > header > cookie)
		const token =
			context.req.query('authenticationToken') ||
			extractToken(context.req.header('Authorization')) ||
			getCookie(context, 'tolo_session') ||
			null

		// Handle missing token
		if (!token) {
			if (required) {
				throw new HTTPException(401, { message: 'Unauthorized' })
			}
			return next()
		}

		// Verify JWT token
		const [clientId, payload] = await verifyJwt(token, context.env.JWT_SECRET)

		// Handle invalid token
		if (!clientId || !payload) {
			if (required) {
				throw new HTTPException(403, { message: 'Unauthorized' })
			}
			return next()
		}

		const userId = Number.parseInt(clientId, 10)

		// Set user context in Sentry
		Sentry.setUser({
			email: 'email' in payload ? (payload.email as string) : undefined,
			id: userId.toString(),
			name: 'name' in payload ? (payload.name as string) : undefined,
			phone: 'phone' in payload ? (payload.phone as string) : undefined,
		})

		// Store JWT data in context for downstream handlers
		context.set('jwt', {
			payload,
			token,
			userId,
		})

		return next()
	})
}
