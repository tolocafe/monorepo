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

export type AuthenticatedJwtVariables = {
	jwt: {
		payload: JWTPayload
		token: string
		userId: number
	}
}

/**
 * Middleware for JWT authentication with Sentry and PostHog integration
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
 * Middleware to require authentication
 */
export function requireAuth() {
	return createMiddleware<{
		Bindings: Bindings
		Variables: AuthenticatedJwtVariables
	}>(async (context, next) => {
		const jwt = context.get('jwt')

		if (!jwt) {
			throw new HTTPException(401, { message: 'Unauthorized' })
		}

		return next()
	})
}
