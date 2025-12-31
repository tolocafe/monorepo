import * as Sentry from '@sentry/cloudflare'

import type { DashTransaction } from '~common/api'
import type { Bindings } from '~workers/types'

import { createCaches } from './ensure'
import { processTransactionEvents } from './events'
import type { TransactionChange } from './events'
import { fetchTransactionsPaginated } from './fetch'
import { upsertTransaction } from './transaction'
import type { Database } from './transactions'

type SyncDateRangeOptions = {
	dateFrom: Date | null // null = all transactions
	environment: Bindings
	passDatabase: D1Database
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
	const { dateFrom, environment, passDatabase, token } = options
	const today = new Date()
	const dateFrom_ =
		dateFrom ?? new Date(today.getTime() - 1000 * 60 * 60 * 24 * 365 * 10)

	const fetched = await fetchTransactionsPaginated(token, dateFrom_, today, {
		chunkDays: 30,
		maxTransactionsPerChunk: 1000,
	})

	// Sort by ID to process oldest first
	const toProcess = [...fetched].toSorted(
		(a, b) => Number(a.transaction_id) - Number(b.transaction_id),
	)

	const created: DashTransaction[] = []
	const updated: DashTransaction[] = []
	const changes: TransactionChange[] = []
	let errors = 0
	const errorSamples: string[] = []
	const caches = createCaches()

	for (const tx of toProcess) {
		try {
			const change = await upsertTransaction(
				{ cache: caches, database, token },
				tx,
			)

			changes.push(change)

			if (change.action === 'created') {
				created.push(tx)
			} else {
				updated.push(tx)
			}
		} catch (error) {
			errors += 1
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

	// Process events after sync completes
	if (changes.length > 0) {
		try {
			await processTransactionEvents(
				changes,
				passDatabase,
				environment,
				database,
			)
		} catch (error) {
			Sentry.captureException(error, {
				level: 'warning',
				tags: { operation: 'transaction_events' },
			})
		}
	}

	const lastProcessed = toProcess.at(-1)
	const lastProcessedId = lastProcessed
		? Number(lastProcessed.transaction_id)
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
