import { eq } from 'drizzle-orm'

import { syncState } from '~workers/db/schema'

import type { Database } from './transactions'

/**
 * Get the current transaction sync cursor state
 */
export async function getTransactionCursor(database: Database) {
	const rows = await database
		.select()
		.from(syncState)
		.where(eq(syncState.id, 'transactions'))
	return rows.at(0)
}

/**
 * Update a sync timestamp field
 */
export async function updateSyncTimestamp(
	database: Database,
	field:
		| 'lastAllSyncAt'
		| 'lastMonthSyncAt'
		| 'lastTodaySyncAt'
		| 'lastWeekSyncAt',
	timestamp: string,
) {
	const existing = await getTransactionCursor(database)
	const payload = {
		[field]: timestamp,
		id: 'transactions',
		...existing,
	}

	await database
		.insert(syncState)
		.values(payload)
		.onConflictDoUpdate({
			set: { [field]: timestamp },
			target: syncState.id,
		})
}

/**
 * Upsert sync state with last transaction ID
 */
export async function upsertSyncState(
	database: Database,
	lastTransactionId: number,
) {
	const payload = {
		id: 'transactions',
		lastTransactionId,
		updatedAt: new Date().toISOString(),
	}

	await database.insert(syncState).values(payload).onConflictDoUpdate({
		set: payload,
		target: syncState.id,
	})
}
