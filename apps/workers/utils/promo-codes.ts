const CHARSET = 'ABCDEFGHIJKMNPQRSTUVWXYZ123456789'
const CODE_LENGTH = 6
const MAX_RETRIES = 5

export function formatPromoCode(code: string) {
	return `${code.slice(0, 3)}-${code.slice(3)}`
}

export function normalizePromoCode(input: string) {
	return input.replace(/-/g, '').toUpperCase()
}

function generatePromoCode() {
	const bytes = new Uint8Array(CODE_LENGTH)
	crypto.getRandomValues(bytes)
	let code = ''
	for (const byte of bytes) {
		code += CHARSET[byte % CHARSET.length]
	}
	return code
}

export async function ensurePromoCodesTable(db: D1Database) {
	await db.exec(
		'CREATE TABLE IF NOT EXISTS promo_codes (code TEXT PRIMARY KEY, amount INTEGER NOT NULL CHECK (amount >= 10000 AND amount <= 200000), created_by INTEGER NOT NULL, redeemed_by INTEGER, redeemed_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
	)
}

export async function createPromoCode(
	db: D1Database,
	amount: number,
	createdBy: number,
) {
	for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
		const code = generatePromoCode()
		try {
			const result = await db
				.prepare(
					'INSERT INTO promo_codes (code, amount, created_by) VALUES (?, ?, ?) RETURNING code, amount, created_at',
				)
				.bind(code, amount, createdBy)
				.first<{ amount: number; code: string; created_at: string }>()

			if (!result) {
				throw new Error('Failed to create promo code')
			}

			return {
				amount: result.amount,
				code: formatPromoCode(result.code),
				createdAt: result.created_at,
			}
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes('UNIQUE constraint failed') &&
				attempt < MAX_RETRIES - 1
			) {
				continue
			}
			throw error
		}
	}

	throw new Error('Failed to generate unique promo code')
}

export async function getPromoCode(db: D1Database, code: string) {
	const normalized = normalizePromoCode(code)
	return db
		.prepare('SELECT * FROM promo_codes WHERE code = ?')
		.bind(normalized)
		.first<{
			amount: number
			code: string
			created_at: string
			created_by: number
			redeemed_at: string | null
			redeemed_by: number | null
		}>()
}

export async function redeemPromoCode(
	db: D1Database,
	code: string,
	redeemedBy: number,
) {
	const normalized = normalizePromoCode(code)
	return db
		.prepare(
			'UPDATE promo_codes SET redeemed_by = ?, redeemed_at = datetime() WHERE code = ? AND redeemed_by IS NULL RETURNING code, amount',
		)
		.bind(redeemedBy, normalized)
		.first<{ amount: number; code: string }>()
}

export async function unredeemPromoCode(db: D1Database, code: string) {
	const normalized = normalizePromoCode(code)
	await db
		.prepare(
			'UPDATE promo_codes SET redeemed_by = NULL, redeemed_at = NULL WHERE code = ?',
		)
		.bind(normalized)
		.run()
}
