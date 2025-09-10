import { startSpan } from '@sentry/cloudflare'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { jwtVerify, SignJWT } from 'jose'

import type { Context } from 'hono'

const encoder = new TextEncoder()
const secretKey = (secret: string) => encoder.encode(secret)

export async function authenticate(context: Context, secret: string) {
	const token =
		context.req.query('authenticationToken') ||
		extractToken(context.req.header('Authorization')) ||
		getCookie(context, 'tolo_session') ||
		null

	if (!token) throw new HTTPException(401, { message: 'Unauthorized' })

	const [clientId, payload] = await verifyJwt(token, secret)

	if (!clientId) throw new HTTPException(403, { message: 'Unauthorized' })

	return [Number.parseInt(clientId, 10), payload, token] as const
}

export function extractToken(
	authorizationHeader?: null | string,
): null | string {
	if (!authorizationHeader) return null
	return authorizationHeader.startsWith('Bearer ')
		? authorizationHeader.slice(7)
		: null
}

export async function signJwt(
	data: { email?: string; name?: string; phone?: string; sub: string },
	secret: string,
	options?: { skipIssuedAt?: boolean },
): Promise<string> {
	return startSpan({ name: 'jwt.sign' }, () => {
		const jwt = new SignJWT(data).setProtectedHeader({
			alg: 'HS256',
			typ: 'JWT',
		})

		if (!options?.skipIssuedAt) {
			jwt.setIssuedAt()
		}

		return jwt.sign(secretKey(secret))
	})
}

export async function verifyJwt(token: string, secret: string) {
	try {
		const { payload } = await startSpan({ name: 'jwt.verify' }, () =>
			jwtVerify(token, secretKey(secret)),
		)

		return [payload.sub, payload] as const
	} catch {
		return [undefined, undefined] as const
	}
}
