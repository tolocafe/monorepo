import * as Sentry from '@sentry/cloudflare'

import { api } from './utils/poster'

import type { Bindings } from './types'

type TransactionData = {
	client_id: string
	date_created: string
	payed_sum: string
	products?: {
		num: string
		product_id: string
		product_price: string
	}[]
	transaction_id: string
}

/**
 * Batch process items with concurrency control
 */
async function batchProcess<T, R>(
	items: T[],
	processor: (item: T) => Promise<R>,
	concurrency = 10,
): Promise<R[]> {
	const results: R[] = []
	for (let index = 0; index < items.length; index += concurrency) {
		const batch = items.slice(index, index + concurrency)
		const batchResults = await Promise.all(batch.map((item) => processor(item)))
		results.push(...batchResults)
	}
	return results
}

async function syncData(
	_controller: ScheduledController,
	environment: Bindings,
	_context: ExecutionContext,
) {
	const startTime = Date.now()

	Sentry.addBreadcrumb({
		category: 'sync',
		level: 'info',
		message: 'Starting scheduled data sync',
	})

	try {
		const result = await syncTransactions(
			environment.POSTER_TOKEN,
			environment.D1_TOLO,
		)

		const duration = Date.now() - startTime

		Sentry.setContext('Sync Results', {
			duration_ms: duration,
			errors: result.errors,
			synced: result.synced,
		})

		if (result.errors > 0) {
			Sentry.captureMessage(
				`Sync completed with ${result.errors} errors out of ${result.synced + result.errors} transactions`,
				'warning',
			)
		}

		Sentry.addBreadcrumb({
			category: 'sync',
			data: {
				duration_ms: duration,
				errors: result.errors,
				synced: result.synced,
			},
			level: 'info',
			message: 'Sync completed successfully',
		})

		// eslint-disable-next-line no-console
		console.log(
			`Sync completed: ${result.synced} synced, ${result.errors} errors in ${duration}ms`,
		)
	} catch (error) {
		const duration = Date.now() - startTime

		Sentry.setContext('Sync Error', {
			duration_ms: duration,
			error: error instanceof Error ? error.message : String(error),
		})

		Sentry.addBreadcrumb({
			category: 'sync',
			data: {
				duration_ms: duration,
			},
			level: 'error',
			message: 'Sync failed',
		})

		Sentry.captureException(error, {
			level: 'error',
			tags: {
				sync_operation: 'transactions',
			},
		})

		// eslint-disable-next-line no-console
		console.error('Sync failed:', error)
		throw error
	}
}

/**
 * Sync transaction data from Poster to D1
 */
async function syncTransactions(
	token: string,
	database: D1Database,
): Promise<{ errors: number; synced: number }> {
	Sentry.addBreadcrumb({
		category: 'sync',
		level: 'info',
		message: 'Fetching transaction IDs from Poster API',
	})

	// Fetch transaction IDs from Poster
	const transactionIds = await api.transactions.getTransactions(token, {
		per_page: 1000,
	})

	Sentry.setContext('Transactions Fetch', {
		count: transactionIds.length,
	})

	Sentry.addBreadcrumb({
		category: 'sync',
		data: {
			count: transactionIds.length,
		},
		level: 'info',
		message: `Found ${transactionIds.length} transactions to sync`,
	})

	// eslint-disable-next-line no-console
	console.log(`Found ${transactionIds.length} transactions to sync`)

	let synced = 0
	let errors = 0
	const failedTransactions: number[] = []

	// Process transactions in batches to avoid overwhelming the API
	await batchProcess(
		transactionIds,
		async (id) => {
			try {
				// Fetch full transaction details
				const transaction = await api.dash.getTransaction(
					token,
					id.toString(),
					{ include_products: 'true' },
				)

				if (!transaction) {
					// eslint-disable-next-line no-console
					console.warn(`Transaction ${id} not found`)
					failedTransactions.push(id)
					errors++
					return
				}

				// Prepare data for database
				const transactionData: TransactionData = {
					client_id: transaction.client_id,
					date_created: new Date().toISOString(), // Poster API doesn't return date, using current time
					payed_sum: transaction.payed_sum,
					products: transaction.products,
					transaction_id: id.toString(),
				}

				// Upsert transaction into D1
				await database
					.prepare(
						`
						INSERT INTO transactions (transaction_id, client_id, payed_sum, products, date_created, date_updated, synced_at)
						VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
						ON CONFLICT(transaction_id) DO UPDATE SET
							client_id = excluded.client_id,
							payed_sum = excluded.payed_sum,
							products = excluded.products,
							date_updated = CURRENT_TIMESTAMP,
							synced_at = CURRENT_TIMESTAMP
					`,
					)
					.bind(
						transactionData.transaction_id,
						transactionData.client_id,
						transactionData.payed_sum,
						transactionData.products
							? JSON.stringify(transactionData.products)
							: null,
						transactionData.date_created,
					)
					.run()

				synced++

				// Add breadcrumb for every 10th successful sync
				if (synced % 10 === 0) {
					Sentry.addBreadcrumb({
						category: 'sync',
						data: {
							synced,
						},
						level: 'info',
						message: `Synced ${synced} transactions`,
					})
				}
			} catch (error) {
				failedTransactions.push(id)
				errors++

				Sentry.addBreadcrumb({
					category: 'sync',
					data: {
						error: error instanceof Error ? error.message : String(error),
						transaction_id: id,
					},
					level: 'error',
					message: `Failed to sync transaction ${id}`,
				})

				Sentry.captureException(error, {
					contexts: {
						transaction: {
							transaction_id: id,
						},
					},
					level: 'error',
					tags: {
						operation: 'transaction_sync',
					},
				})

				// eslint-disable-next-line no-console
				console.error(`Error syncing transaction ${id}:`, error)
			}
		},
		10, // Process 10 transactions concurrently
	)

	if (failedTransactions.length > 0) {
		Sentry.setContext('Failed Transactions', {
			count: failedTransactions.length,
			ids: failedTransactions.slice(0, 50), // Only log first 50 to avoid bloat
		})
	}

	return { errors, synced }
}

const scheduledHandler = ((controller, environment, context) => {
	Sentry.captureMessage('Starting scheduled data sync')

	context.waitUntil(syncData(controller, environment, context))
}) as ExportedHandlerScheduledHandler<Bindings>

export default scheduledHandler
