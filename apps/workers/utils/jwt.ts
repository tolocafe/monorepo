import { startSpan } from '@sentry/cloudflare'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { jwtVerify, SignJWT } from 'jose'

import HttpStatusCode from '~/utils/http-codes'

const encoder = new TextEncoder()
const secretKey = (secret: string) => encoder.encode(secret)

export async function authenticate(context: Context, secret: string) {
	const token =
		context.req.query('authenticationToken') ||
		extractToken(context.req.header('Authorization')) ||
		getCookie(context, 'tolo_session') ||
		null

	if (!token)
		throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
			message: 'Unauthorized',
		})

	const [clientId, payload] = await verifyJwt(token, secret)

	if (!clientId)
		throw new HTTPException(HttpStatusCode.FORBIDDEN, {
			message: 'Unauthorized',
		})

	return [Number(clientId), payload, token] as const
}

export function extractToken(
	authorizationHeader?: null | string,
): null | string {
	if (!authorizationHeader) return null
	return authorizationHeader.startsWith('Bearer ')
		? authorizationHeader.slice(7)
		: null
}

// oxlint-disable-next-line no-magic-numbers
export const DEFAULT_AUTH_TOKEN_VALIDITY_IN_MS = 60 * 60 * 24 * 365 * 1000
export const DEFAULT_AUTH_TOKEN_VALIDITY_IN_SECONDS =
	DEFAULT_AUTH_TOKEN_VALIDITY_IN_MS / 1000

export function signJwt(
	data: { email?: string; name?: string; phone?: string; sub: string },
	secret: string,
	options?: { expiresIn?: string; skipIssuedAt?: boolean },
): Promise<string> {
	return startSpan({ name: 'jwt.sign' }, () => {
		const jwt = new SignJWT(data).setProtectedHeader({
			alg: 'HS256',
			typ: 'JWT',
		})

		if (!options?.skipIssuedAt) {
			jwt.setIssuedAt()
		}

		// Default to 1 year expiration for session tokens
		jwt.setExpirationTime(
			options?.expiresIn ?? DEFAULT_AUTH_TOKEN_VALIDITY_IN_MS,
		)

		return jwt.sign(secretKey(secret))
	})
}

export async function verifyJwt(token: string | undefined, secret: string) {
	try {
		if (!token) throw new Error('No token provided')

		const { payload } = await startSpan({ name: 'jwt.verify' }, () =>
			jwtVerify(token, secretKey(secret)),
		)

		return [payload.sub, payload] as const
	} catch {
		return [undefined, undefined] as const
	}
}
