import { HTTPException } from 'hono/http-exception'

const DEFAULT_OTP_TTL = 300

export function generateOtp(length = 6) {
	return [...crypto.getRandomValues(new Uint32Array(length))]
		.map((v) => (v % 10).toString())
		.join('')
}

export async function storeOtp(
	phone: string,
	code: string,
	options: {
		kv: KVNamespace
		testPhoneNumbers: string[]
		ttl?: number
	},
) {
	if (options.testPhoneNumbers.includes(phone)) return

	await options.kv.put(phone, code, {
		expirationTtl: options.ttl ?? DEFAULT_OTP_TTL,
	})
}

export async function verifyOtp(
	phone: string,
	code: string,
	options: {
		kv: KVNamespace
		testOtpCode?: string
		testPhoneNumbers: string[]
	},
) {
	if (
		options.testPhoneNumbers.includes(phone) &&
		options.testOtpCode &&
		code === options.testOtpCode
	) {
		return { isTest: true }
	}

	const stored = await options.kv.get(phone)

	if (!stored || stored !== code) {
		throw new HTTPException(401, { message: 'Invalid or expired code' })
	}

	await options.kv.delete(phone)

	return { isTest: false }
}
