import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { jwtVerify, SignJWT } from 'jose'

import type { Context } from 'hono'

const encoder = new TextEncoder()
const secretKey = (secret: string) => encoder.encode(secret)

export async function authenticate(context: Context, secret: string) {
	const authorizationHeader = context.req.header('Authorization')

	const token =
		extractToken(authorizationHeader) ??
		getCookie(context, 'tolo_session') ??
		null

	if (!token) throw new HTTPException(401, { message: 'Unauthorized' })

	const [clientId, payload] = await verifyJwt(token, secret)

	if (!clientId) throw new HTTPException(401, { message: 'Unauthorized' })

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
): Promise<string> {
	return new SignJWT(data)
		.setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
		.setIssuedAt()
		.sign(secretKey(secret))
}

export async function verifyJwt(token: string, secret: string) {
	try {
		const { payload } = await jwtVerify(token, secretKey(secret))

		return [payload.sub, payload] as const
	} catch {
		return [undefined, undefined] as const
	}
}
