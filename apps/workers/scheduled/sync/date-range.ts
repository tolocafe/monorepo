import * as Sentry from '@sentry/cloudflare'

import type { DashTransaction } from '~common/api'
import type { Bindings } from '~workers/types'

import { createCaches } from './ensure'
import { processTransactionEvents } from './events'
import { fetchTransactionsPaginated } from './fetch'
import { getTransactionCursor } from './state'
import { upsertTransaction } from './transaction'
import { formatApiDate } from './utils'

import type { TransactionChange } from './events'
import type { Database } from './transactions'

type SyncDateRangeOptions = {
	dateFrom: Date | null // null = all transactions
	environment: Bindings
	passDatabase: D1Database
	stopAtCursor: boolean // true = incremental (stop at known transaction)
	token: string
}

/**
 * Sync transactions for a specific date range
 */
export async function syncDateRange(
	database: Database,
	options: SyncDateRangeOptions,
): Promise<{
	created: DashTransaction[]
	errors: number
	errorSamples: string[]
	fetchedCount?: number
	lastProcessedId?: number
	toProcessCount?: number
	updated: DashTransaction[]
}> {
	const { dateFrom, environment, passDatabase, stopAtCursor, token } = options
	const today = new Date()
	const dateFrom_ =
		dateFrom ?? new Date(today.getTime() - 1000 * 60 * 60 * 24 * 365 * 10) // 10 years ago for "all"

	// eslint-disable-next-line no-console
	console.log(
		`[syncDateRange] Fetching from ${formatApiDate(dateFrom_)} to ${formatApiDate(today)}`,
	)

	const fetched = await fetchTransactionsPaginated(token, dateFrom_, today, {
		chunkDays: 30, // Fetch in 30-day chunks
		maxTransactionsPerChunk: 1000, // Split further if > 1000 transactions
	})

	// eslint-disable-next-line no-console
	console.log(`[syncDateRange] Fetched ${fetched.length} transactions`)

	const state = await getTransactionCursor(database)

	const sorted = [...fetched].toSorted(
		(a, b) =>
			Number.parseInt(b.transaction_id, 10) -
			Number.parseInt(a.transaction_id, 10),
	)

	const toProcess: DashTransaction[] = []
	if (stopAtCursor && state?.lastTransactionId) {
		// Incremental: only process new transactions
		for (const tx of sorted) {
			const txId = Number.parseInt(tx.transaction_id, 10)
			if (txId <= state.lastTransactionId) {
				break
			}
			toProcess.push(tx)
		}
	} else {
		// Full update: process all transactions in range
		toProcess.push(...sorted)
	}

	// Process oldest first
	toProcess.reverse()

	// eslint-disable-next-line no-console
	console.log(`[syncDateRange] Processing ${toProcess.length} transactions`)

	const created: DashTransaction[] = []
	const updated: DashTransaction[] = []
	const changes: TransactionChange[] = []
	let errors = 0
	const errorSamples: string[] = []
	const caches = createCaches()

	for (let index = 0; index < toProcess.length; index++) {
		const tx = toProcess[index]

		if (index % 100 === 0 && index > 0) {
			// eslint-disable-next-line no-console
			console.log(
				`[syncDateRange] Processing ${index + 1}/${toProcess.length}...`,
			)
		}

		try {
			const change = await upsertTransaction(
				{
					cache: caches,
					database,
					token,
				},
				tx,
			)

			changes.push(change)

			if (change.action === 'created') {
				created.push(tx)
			} else {
				updated.push(tx)
			}
		} catch (error) {
			errors++
			const message = error instanceof Error ? error.message : String(error)
			if (errorSamples.length < 5) {
				errorSamples.push(message)
			}
			Sentry.captureException(error, {
				contexts: { transaction: { transaction_id: tx.transaction_id } },
				level: 'error',
				tags: { operation: 'transaction_sync' },
			})
		}
	}

	// Process events after sync completes (notifications, pass updates, etc.)
	if (changes.length > 0) {
		try {
			await processTransactionEvents(changes, passDatabase, environment)
		} catch (error) {
			// Log but don't fail sync if event processing fails
			Sentry.captureException(error, {
				level: 'warning',
				tags: { operation: 'transaction_events' },
			})
		}
	}

	const lastProcessed = toProcess.at(-1)
	const lastProcessedId = lastProcessed
		? Number.parseInt(lastProcessed.transaction_id, 10)
		: undefined

	return {
		created,
		errors,
		errorSamples,
		fetchedCount: fetched.length,
		lastProcessedId,
		toProcessCount: toProcess.length,
		updated,
	}
}
