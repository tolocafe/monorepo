import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { jwtVerify, SignJWT } from 'jose'

import type { Context } from 'hono'

const encoder = new TextEncoder()
const secretKey = (secret: string) => encoder.encode(secret)

export async function authenticate(c: Context, secret: string) {
	const authorizationHeader = c.req.header('Authorization')

	const token =
		extractToken(authorizationHeader) ?? getCookie(c, 'tolo_session') ?? null

	if (!token) throw new HTTPException(401, { message: 'Unauthorized' })

	const clientId = await verifyJwt(token, secret)

	if (!clientId) throw new HTTPException(401, { message: 'Unauthorized' })

	return Number.parseInt(clientId, 10)
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
	clientId: string,
	secret: string,
): Promise<string> {
	return new SignJWT({ sub: clientId })
		.setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
		.setIssuedAt()
		.sign(secretKey(secret))
}

export async function verifyJwt(
	token: string,
	secret: string,
): Promise<null | string> {
	try {
		const { payload } = await jwtVerify(token, secretKey(secret))
		return typeof payload.sub === 'string' ? payload.sub : null
	} catch {
		return null
	}
}
