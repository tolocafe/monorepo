import * as Sentry from '@sentry/cloudflare'

import type { DashTransaction } from '~common/api'
import { getDatabase } from '~workers/db/client'
import type { Bindings } from '~workers/types'

import { syncDateRange } from './date-range'
import { getTransactionCursor, updateSyncTimestamp } from './state'

export type Database = ReturnType<typeof getDatabase>

export type SyncResult = {
	created: DashTransaction[]
	errors: number
	errorSamples?: string[]
	fetchedCount?: number
	startCursor?: null | number
	synced: number
	toProcessCount?: number
	updated: DashTransaction[]
}

/**
 * Tiered sync strategy:
 * - Today: Always sync ALL transactions from yesterday (to detect status changes)
 * - Last week: Update daily (if last sync > 1 day ago)
 * - Last month: Update weekly (if last sync > 1 week ago)
 * - All transactions: Full sync monthly (if last sync > 1 month ago)
 */
export default async function syncTransactions(
	token: string,
	hyperdrive: Bindings['HYPERDRIVE'],
	passDatabase: D1Database,
	environment: Bindings,
): Promise<SyncResult> {
	const database_ = getDatabase(hyperdrive)

	try {
		Sentry.addBreadcrumb({
			category: 'sync',
			level: 'info',
			message: 'Starting tiered data sync',
		})

		const state = await getTransactionCursor(database_)
		const now = new Date()
		const nowISO = now.toISOString()

		// Calculate date ranges
		const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24)
		const oneDayAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24)
		const oneWeekAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)
		const oneMonthAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)

		// Determine what needs syncing
		const needsAllSync =
			!state?.lastAllSyncAt || new Date(state.lastAllSyncAt) < oneMonthAgo
		const needsMonthSync =
			!state?.lastMonthSyncAt || new Date(state.lastMonthSyncAt) < oneWeekAgo
		const needsWeekSync =
			!state?.lastWeekSyncAt || new Date(state.lastWeekSyncAt) < oneDayAgo

		const allCreated: DashTransaction[] = []
		const allUpdated: DashTransaction[] = []
		let totalErrors = 0
		const errorSamples: string[] = []

		// 1. Sync all transactions (monthly)
		if (needsAllSync) {
			const result = await syncDateRange(database_, {
				dateFrom: null,
				environment,
				passDatabase,
				token,
			})
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastAllSyncAt', nowISO)
		}

		// 2. Sync last month (weekly)
		if (needsMonthSync) {
			const result = await syncDateRange(database_, {
				dateFrom: oneMonthAgo,
				environment,
				passDatabase,
				token,
			})
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastMonthSyncAt', nowISO)
		}

		// 3. Sync last week (daily)
		if (needsWeekSync) {
			const result = await syncDateRange(database_, {
				dateFrom: oneWeekAgo,
				environment,
				passDatabase,
				token,
			})
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastWeekSyncAt', nowISO)
		}

		// 4. Always sync recent transactions (from yesterday to handle timezone differences)
		const todayResult = await syncDateRange(database_, {
			dateFrom: yesterday,
			environment,
			passDatabase,
			token,
		})
		allCreated.push(...todayResult.created)
		allUpdated.push(...todayResult.updated)
		totalErrors += todayResult.errors
		errorSamples.push(...todayResult.errorSamples)
		await updateSyncTimestamp(database_, 'lastTodaySyncAt', nowISO)

		Sentry.captureMessage(
			`sync:done created=${allCreated.length} updated=${allUpdated.length} errors=${totalErrors}`,
			totalErrors > 0 ? 'warning' : 'info',
		)

		return {
			created: allCreated,
			errorSamples,
			errors: totalErrors,
			fetchedCount: todayResult.fetchedCount ?? 0,
			startCursor: state?.lastTransactionId ?? null,
			synced: allCreated.length + allUpdated.length,
			toProcessCount: todayResult.toProcessCount ?? 0,
			updated: allUpdated,
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)

		Sentry.captureException(error, {
			level: 'error',
			tags: { sync_operation: 'transactions' },
		})

		return {
			created: [],
			errorSamples: [errorMessage],
			errors: 1,
			synced: 0,
			updated: [],
		}
	}
}
