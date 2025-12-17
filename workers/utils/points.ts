/**
 * Points System Utility
 *
 * Calculates customer loyalty points based on their transactions and redemptions.
 * - Each transaction (order/visit) = 1 point
 * - 10 points = 1 free drink redemption
 * - Each redemption subtracts 10 points
 * - Birthday drink: one free drink per year, available from birthday until redeemed
 */

/** Number of points required for one free drink redemption */
export const POINTS_PER_REDEMPTION = 10

/**
 * Calculate how many free drinks are available to redeem
 *
 * @param points - Current available points
 * @returns Number of free drinks available
 */
export function calculateAvailableRedemptions(points: number): number {
	return Math.floor(points / POINTS_PER_REDEMPTION)
}

/**
 * Calculate available points for a customer
 *
 * @param transactionsCount - Total number of transactions (orders/visits)
 * @param redemptionsCount - Total number of free drink redemptions used
 * @returns Available points (minimum 0)
 */
export function calculatePoints(
	transactionsCount: number,
	redemptionsCount: number,
): number {
	const totalPointsEarned = transactionsCount
	const totalPointsSpent = redemptionsCount * POINTS_PER_REDEMPTION
	return Math.max(0, totalPointsEarned - totalPointsSpent)
}

/**
 * Check if customer can redeem a free drink
 *
 * @param points - Current available points
 * @returns True if customer has enough points for a redemption
 */
export function canRedeem(points: number): boolean {
	return points >= POINTS_PER_REDEMPTION
}

/**
 * Check if customer can redeem a birthday drink
 * Returns true if they have a birthday on file and haven't redeemed since their last birthday
 */
export async function canRedeemBirthdayDrink(
	database: D1Database,
	clientId: number,
	birthday: null | string | undefined,
): Promise<boolean> {
	if (!birthday) return false

	// eslint-disable-next-line no-console
	console.log('[points] canRedeemBirthdayDrink: checking', {
		birthday,
		clientId,
	})

	await ensureRedemptionsTable(database)

	const lastBirthday = getLastBirthdayDate(birthday)
	const lastBirthdayISO = lastBirthday.toISOString().split('T')[0]

	// eslint-disable-next-line no-console
	console.log('[points] canRedeemBirthdayDrink: lastBirthday', lastBirthdayISO)

	try {
		// Check if there's a birthday redemption since the last birthday
		const result = await database
			.prepare(
				`SELECT COUNT(*) as count FROM redemptions
				 WHERE client_id = ? AND type = 'birthday' AND DATE(created_at) >= ?`,
			)
			.bind(clientId, lastBirthdayISO)
			.first<{ count: number }>()

		const hasRedeemed = (result?.count ?? 0) > 0
		// eslint-disable-next-line no-console
		console.log('[points] canRedeemBirthdayDrink: hasRedeemed', hasRedeemed)

		return !hasRedeemed
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('[points] canRedeemBirthdayDrink: error', error)
		throw error
	}
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
	// eslint-disable-next-line no-console
	console.log('[points] createRedemption: starting', {
		clientId,
		redeemedBy,
		type,
	})

	await ensureRedemptionsTable(database)

	const createdAt = new Date().toISOString()

	try {
		const result = await database
			.prepare(
				`INSERT INTO redemptions (client_id, type, redeemed_by, created_at)
				 VALUES (?, ?, ?, ?)
				 RETURNING id`,
			)
			.bind(clientId, type, redeemedBy, createdAt)
			.first<{ id: number }>()

		// eslint-disable-next-line no-console
		console.log('[points] createRedemption: success', result)

		return {
			createdAt,
			id: result?.id ?? 0,
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('[points] createRedemption: error', error)
		throw error
	}
}

/**
 * Ensure the redemptions table exists in D1
 */
export async function ensureRedemptionsTable(
	database: D1Database,
): Promise<void> {
	// eslint-disable-next-line no-console
	console.log('[points] ensureRedemptionsTable: starting')
	try {
		const statement = database.prepare(
			`CREATE TABLE IF NOT EXISTS redemptions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				client_id INTEGER NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('birthday', 'visits')),
				redeemed_by INTEGER NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`,
		)
		// eslint-disable-next-line no-console
		console.log('[points] ensureRedemptionsTable: statement prepared')
		const result = await statement.run()
		// eslint-disable-next-line no-console
		console.log('[points] ensureRedemptionsTable: result', result)
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('[points] ensureRedemptionsTable: error', error)
		throw error
	}
}

/**
 * Get customer points data including transactions, redemptions, and calculated points
 */
export async function getCustomerPoints(
	database: D1Database,
	clientId: number,
	transactionsCount: number,
): Promise<{
	availableRedemptions: number
	points: number
	redemptionsCount: number
	transactionsCount: number
}> {
	// eslint-disable-next-line no-console
	console.log('[points] getCustomerPoints: starting', {
		clientId,
		transactionsCount,
	})

	try {
		const redemptionsCount = await getRedemptionsCount(
			database,
			clientId,
			'visits',
		)
		// eslint-disable-next-line no-console
		console.log(
			'[points] getCustomerPoints: redemptionsCount',
			redemptionsCount,
		)

		const points = calculatePoints(transactionsCount, redemptionsCount)
		// eslint-disable-next-line no-console
		console.log('[points] getCustomerPoints: calculated points', points)

		return {
			availableRedemptions: calculateAvailableRedemptions(points),
			points,
			redemptionsCount,
			transactionsCount,
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('[points] getCustomerPoints: error', error)
		throw error
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
	// eslint-disable-next-line no-console
	console.log('[points] getRedemptionsCount: starting', { clientId, type })

	await ensureRedemptionsTable(database)

	const query = type
		? 'SELECT COUNT(*) as count FROM redemptions WHERE client_id = ? AND type = ?'
		: 'SELECT COUNT(*) as count FROM redemptions WHERE client_id = ?'

	const bindings = type ? [clientId, type] : [clientId]

	// eslint-disable-next-line no-console
	console.log('[points] getRedemptionsCount: executing query', {
		bindings,
		query,
	})

	try {
		const statement = database.prepare(query).bind(...bindings)
		// eslint-disable-next-line no-console
		console.log('[points] getRedemptionsCount: statement prepared')
		const result = await statement.first<{ count: number }>()
		// eslint-disable-next-line no-console
		console.log('[points] getRedemptionsCount: result', result)
		return result?.count ?? 0
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('[points] getRedemptionsCount: error', error)
		throw error
	}
}
