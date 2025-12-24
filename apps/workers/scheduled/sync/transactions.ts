import * as Sentry from '@sentry/cloudflare'

import { getDatabase } from '~workers/db/client'

import type { DashTransaction } from '~common/api'
import type { Bindings } from '~workers/types'

import { syncDateRange } from './date-range'
import {
	getTransactionCursor,
	updateSyncTimestamp,
	upsertSyncState,
} from './state'

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
 * - Today: Always sync incrementally (from cursor)
 * - Last week: Update weekly (if last sync > 1 day ago)
 * - Last month: Update weekly (if last sync > 1 week ago)
 * - All transactions: Full sync monthly (if last sync > 1 month ago)
 */
export default async function syncTransactions(
	token: string,
	hyperdrive: Bindings['HYPERDRIVE'],
	passDatabase: D1Database,
	environment: Bindings,
): Promise<SyncResult> {
	const startTime = Date.now()
	// eslint-disable-next-line no-console
	console.log('[syncTransactions] Starting tiered sync...')

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
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
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

		// eslint-disable-next-line no-console
		console.log('[syncTransactions] Sync needs:', {
			all: needsAllSync,
			month: needsMonthSync,
			today: true,
			week: needsWeekSync,
		})

		const allCreated: DashTransaction[] = []
		const allUpdated: DashTransaction[] = []
		let totalErrors = 0
		const errorSamples: string[] = []

		// 1. Sync all transactions (monthly)
		if (needsAllSync) {
			// eslint-disable-next-line no-console
			console.log(
				'[syncTransactions] ⚡ Syncing ALL transactions (monthly full sync)...',
			)
			const allSyncStart = Date.now()
			const result = await syncDateRange(database_, {
				dateFrom: null, // No date limit - sync all
				environment,
				passDatabase,
				stopAtCursor: false, // Don't stop at cursor
				token,
			})
			const allSyncDuration = Date.now() - allSyncStart
			// eslint-disable-next-line no-console
			console.log(
				`[syncTransactions] ✅ All sync complete: ${result.created.length} created, ${result.updated.length} updated, ${result.errors} errors in ${allSyncDuration}ms`,
			)
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastAllSyncAt', nowISO)
		}

		// 2. Sync last month (weekly)
		if (needsMonthSync) {
			// eslint-disable-next-line no-console
			console.log('[syncTransactions] 📅 Syncing last month (weekly update)...')
			const monthSyncStart = Date.now()
			const result = await syncDateRange(database_, {
				dateFrom: oneMonthAgo,
				environment,
				passDatabase,
				stopAtCursor: false, // Update all in range
				token,
			})
			const monthSyncDuration = Date.now() - monthSyncStart
			// eslint-disable-next-line no-console
			console.log(
				`[syncTransactions] ✅ Month sync complete: ${result.created.length} created, ${result.updated.length} updated, ${result.errors} errors in ${monthSyncDuration}ms`,
			)
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastMonthSyncAt', nowISO)
		}

		// 3. Sync last week (daily)
		if (needsWeekSync) {
			// eslint-disable-next-line no-console
			console.log('[syncTransactions] 📆 Syncing last week (daily update)...')
			const weekSyncStart = Date.now()
			const result = await syncDateRange(database_, {
				dateFrom: oneWeekAgo,
				environment,
				passDatabase,
				stopAtCursor: false, // Update all in range
				token,
			})
			const weekSyncDuration = Date.now() - weekSyncStart
			// eslint-disable-next-line no-console
			console.log(
				`[syncTransactions] ✅ Week sync complete: ${result.created.length} created, ${result.updated.length} updated, ${result.errors} errors in ${weekSyncDuration}ms`,
			)
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastWeekSyncAt', nowISO)
		}

		// 4. Always sync today (incremental from cursor)
		// eslint-disable-next-line no-console
		console.log(
			'[syncTransactions] 🕐 Syncing today (incremental from cursor)...',
		)
		const todaySyncStart = Date.now()
		const todayResult = await syncDateRange(database_, {
			dateFrom: today,
			environment,
			passDatabase,
			stopAtCursor: true, // Stop at cursor for incremental sync
			token,
		})
		const todaySyncDuration = Date.now() - todaySyncStart
		// eslint-disable-next-line no-console
		console.log(
			`[syncTransactions] ✅ Today sync complete: ${todayResult.created.length} created, ${todayResult.updated.length} updated, ${todayResult.errors} errors in ${todaySyncDuration}ms`,
		)
		allCreated.push(...todayResult.created)
		allUpdated.push(...todayResult.updated)
		totalErrors += todayResult.errors
		errorSamples.push(...todayResult.errorSamples)

		// Update today sync timestamp and cursor
		if (todayResult.lastProcessedId) {
			await upsertSyncState(database_, todayResult.lastProcessedId)
		}
		await updateSyncTimestamp(database_, 'lastTodaySyncAt', nowISO)

		const duration = Date.now() - startTime

		Sentry.setContext('Sync Results', {
			created: allCreated.length,
			duration_ms: duration,
			errors: totalErrors,
			synced: allCreated.length + allUpdated.length,
			updated: allUpdated.length,
		})

		Sentry.captureMessage(
			`sync:done created=${allCreated.length} updated=${allUpdated.length} errors=${totalErrors}`,
			totalErrors > 0 ? 'warning' : 'info',
		)

		return {
			created: allCreated,
			errors: totalErrors,
			errorSamples,
			fetchedCount: todayResult.fetchedCount ?? 0,
			startCursor: state?.lastTransactionId ?? null,
			synced: allCreated.length + allUpdated.length,
			toProcessCount: todayResult.toProcessCount ?? 0,
			updated: allUpdated,
		}
	} catch (error) {
		const duration = Date.now() - startTime
		const errorMessage = error instanceof Error ? error.message : String(error)
		const errorStack = error instanceof Error ? error.stack : undefined

		// eslint-disable-next-line no-console
		console.error('[syncTransactions] ❌ FATAL ERROR:', errorMessage)
		if (errorStack) {
			// eslint-disable-next-line no-console
			console.error('[syncTransactions] Stack:', errorStack)
		}

		Sentry.setContext('Sync Error', {
			duration_ms: duration,
			error: errorMessage,
			stack: errorStack,
		})

		Sentry.captureException(error, {
			level: 'error',
			tags: { sync_operation: 'transactions' },
		})

		return {
			created: [],
			errors: 1,
			errorSamples: [errorMessage],
			synced: 0,
			updated: [],
		}
	}
}
