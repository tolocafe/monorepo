import { HTTPException } from 'hono/http-exception'

import { testPhoneNumbers } from './constants'

const DEFAULT_OTP_TTL = 300

const TEST_OTP_CODE = process.env.TEST_OTP_CODE as string | undefined

export function generateOtp(length = 6) {
	return [...crypto.getRandomValues(new Uint32Array(length))]
		.map((v) => (v % 10).toString())
		.join('')
}

export async function storeOtp(
	kv: KVNamespace,
	phone: string,
	code: string,
	ttl = DEFAULT_OTP_TTL,
) {
	if (testPhoneNumbers.includes(phone)) return

	await kv.put(phone, code, { expirationTtl: ttl })
}

export async function verifyOtp(kv: KVNamespace, phone: string, code: string) {
	if (
		testPhoneNumbers.includes(phone) &&
		TEST_OTP_CODE &&
		code === TEST_OTP_CODE
	) {
		return { isTest: true }
	}

	const stored = await kv.get(phone)

	if (!stored || stored !== code) {
		throw new HTTPException(401, { message: 'Invalid or expired code' })
	}

	return { isTest: false }
}
