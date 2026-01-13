/**
 * Stamps System Utility
 *
 * Calculates customer loyalty stamps based on their transactions and redemptions.
 * - Each transaction (order/visit) = 1 stamp
 * - 10 stamps = 1 free drink redemption
 * - Each redemption subtracts 10 stamps
 * - Birthday drink: one free drink per year, available from birthday until redeemed
 */

/** Number of stamps required for one free drink redemption */
export const STAMPS_PER_REDEMPTION = 10

/**
 * Calculate how many free drinks are available to redeem
 *
 * @param stamps - Current available stamps
 * @returns Number of free drinks available
 */
export function calculateAvailableRedemptions(stamps: number): number {
	return Math.floor(stamps / STAMPS_PER_REDEMPTION)
}

/**
 * Calculate available stamps for a customer
 *
 * @param transactionsCount - Total number of transactions (orders/visits)
 * @param redemptionsCount - Total number of free drink redemptions used
 * @returns Available stamps (minimum 0)
 */
export function calculateStamps(
	transactionsCount: number,
	redemptionsCount: number,
): number {
	const totalStampsEarned = transactionsCount
	const totalStampsSpent = redemptionsCount * STAMPS_PER_REDEMPTION
	return Math.max(0, totalStampsEarned - totalStampsSpent)
}

/**
 * Check if customer can redeem a free drink
 *
 * @param stamps - Current available stamps
 * @returns True if customer has enough stamps for a redemption
 */
export function canRedeem(stamps: number): boolean {
	return stamps >= STAMPS_PER_REDEMPTION
}

/**
 * Check if a birthday string represents a valid date
 */
function isValidBirthday(birthday: string): boolean {
	if (!birthday || birthday === '0000-00-00') return false
	const date = new Date(birthday)
	return !Number.isNaN(date.getTime())
}

/**
 * Check if customer can redeem a birthday drink
 * Returns true if they have a birthday on file and haven't redeemed since their last birthday
 */
export async function canRedeemBirthdayDrink(
	database: D1Database,
	clientId: number,
	birthday: null | string | undefined,
) {
	if (!birthday || !isValidBirthday(birthday)) return false

	await ensureRedemptionsTable(database)

	const lastBirthday = getLastBirthdayDate(birthday)
	const [lastBirthdayISO] = lastBirthday.toISOString().split('T')

	// Check if there's a birthday redemption since the last birthday
	const result = await database
		.prepare(
			`SELECT COUNT(*) as count FROM redemptions
			 WHERE client_id = ? AND type = 'birthday' AND DATE(created_at) >= ?`,
		)
		.bind(clientId, lastBirthdayISO)
		.first<{ count: number }>()

	const hasRedeemed = (result?.count ?? 0) > 0
	return !hasRedeemed
}

/**
 * Create a redemption record in the database
 *
 * @param database - D1 database instance
 * @param clientId - Client ID who is redeeming
 * @param type - Type of redemption ('birthday' or 'visits')
 * @param redeemedBy - Client ID of the team member processing the redemption
 * @returns The created redemption record
 */
export async function createRedemption(
	database: D1Database,
	clientId: number,
	type: 'birthday' | 'visits',
	redeemedBy: number,
): Promise<{ createdAt: string; id: number }> {
	await ensureRedemptionsTable(database)

	const createdAt = new Date().toISOString()

	const result = await database
		.prepare(
			`INSERT INTO redemptions (client_id, type, redeemed_by, created_at)
			 VALUES (?, ?, ?, ?)
			 RETURNING id`,
		)
		.bind(clientId, type, redeemedBy, createdAt)
		.first<{ id: number }>()

	return {
		createdAt,
		id: result?.id ?? 0,
	}
}

/**
 * Ensure the redemptions table exists in D1
 */
export async function ensureRedemptionsTable(
	database: D1Database,
): Promise<void> {
	await database
		.prepare(
			`CREATE TABLE IF NOT EXISTS redemptions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				client_id INTEGER NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('birthday', 'visits')),
				redeemed_by INTEGER NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`,
		)
		.run()
}

/**
 * Get customer stamps data including transactions, redemptions, and calculated stamps
 */
export async function getCustomerStamps(
	database: D1Database,
	clientId: number,
	transactionsCount: number,
): Promise<{
	availableRedemptions: number
	redemptionsCount: number
	stamps: number
	transactionsCount: number
}> {
	const redemptionsCount = await getRedemptionsCount(
		database,
		clientId,
		'visits',
	)

	const stamps = calculateStamps(transactionsCount, redemptionsCount)

	return {
		availableRedemptions: calculateAvailableRedemptions(stamps),
		redemptionsCount,
		stamps,
		transactionsCount,
	}
}

/**
 * Calculate the date of the customer's most recent birthday
 * (could be this year or last year depending on current date)
 */
export function getLastBirthdayDate(birthday: string): Date {
	const birthDate = new Date(birthday)
	const now = new Date()
	const thisYearBirthday = new Date(
		now.getFullYear(),
		birthDate.getMonth(),
		birthDate.getDate(),
	)

	// If this year's birthday hasn't happened yet, use last year's
	if (thisYearBirthday > now) {
		return new Date(
			now.getFullYear() - 1,
			birthDate.getMonth(),
			birthDate.getDate(),
		)
	}

	return thisYearBirthday
}

/**
 * Get the count of redemptions for a specific client
 *
 * @param db - D1 database instance
 * @param clientId - Client ID to get redemptions for
 * @param type - Optional: filter by redemption type ('birthday' or 'visits')
 * @returns Number of redemptions
 */
export async function getRedemptionsCount(
	database: D1Database,
	clientId: number,
	type?: 'birthday' | 'visits',
): Promise<number> {
	await ensureRedemptionsTable(database)

	const query = type
		? 'SELECT COUNT(*) as count FROM redemptions WHERE client_id = ? AND type = ?'
		: 'SELECT COUNT(*) as count FROM redemptions WHERE client_id = ?'

	const bindings = type ? [clientId, type] : [clientId]

	const result = await database
		.prepare(query)
		.bind(...bindings)
		.first<{ count: number }>()

	return result?.count ?? 0
}
