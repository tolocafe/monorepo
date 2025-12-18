import { HTTPException } from 'hono/http-exception'

const DEFAULT_OTP_TTL = 300

export function generateOtp(length = 6) {
	return [...crypto.getRandomValues(new Uint32Array(length))]
		.map((v) => (v % 10).toString())
		.join('')
}

export async function storeOtp(
	kv: KVNamespace,
	phone: string,
	code: string,
	testPhoneNumbers: string[],
	ttl = DEFAULT_OTP_TTL,
) {
	if (testPhoneNumbers.includes(phone)) return

	await kv.put(phone, code, { expirationTtl: ttl })
}

export async function verifyOtp(
	kv: KVNamespace,
	phone: string,
	code: string,
	testPhoneNumbers: string[],
	testOtpCode?: string,
) {
	if (testPhoneNumbers.includes(phone) && testOtpCode && code === testOtpCode) {
		return { isTest: true }
	}

	const stored = await kv.get(phone)

	if (!stored || stored !== code) {
		throw new HTTPException(401, { message: 'Invalid or expired code' })
	}

	// OTPs should be single-use; delete after a successful verification
	await kv.delete(phone)

	return { isTest: false }
}
