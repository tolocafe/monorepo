import * as Sentry from '@sentry/cloudflare'
import { notifyPassUpdate } from 'workers/utils/apns'
import { api } from 'workers/utils/poster'

import type { Bindings } from '../types'

export type SyncResult = {
	created: TransactionData[]
	errors: number
	synced: number
	updated: TransactionData[]
}

type TransactionData = {
	client_id: null | number
	date_close: null | string
	date_created: string
	pay_type: null | number
	payed_sum: number
	processing_status: number
	products?: {
		num: string
		product_id: string
		product_sum?: string
	}[]
	/**
	 * Transaction status
	 * - 0: Deleted
	 * - 1: In progress/Open
	 * - 2: Closed
	 */
	status: number
	table_id: null | number
	transaction_id: number
}

/**
 * Sync transaction data from Poster to D1
 */
export default async function syncTransactions(
	token: string,
	database: D1Database,
	environment: Bindings,
) {
	const startTime = Date.now()

	try {
		Sentry.addBreadcrumb({
			category: 'sync',
			level: 'info',
			message: 'Starting scheduled data sync',
		})

		Sentry.addBreadcrumb({
			category: 'sync',
			level: 'info',
			message: 'Fetching transaction IDs from Poster API',
		})
		const today = new Date()
		const last30DaysAgo = new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30)

		// Fetch all transactions from Poster using v3 dash.getTransactions endpoint
		// Including both open and closed to track order lifecycle (in progress, completed, etc.)
		const transactions = await api.dash.getTransactions(token, {
			date_from: formatApiDate(last30DaysAgo),
			date_to: formatApiDate(today),
			include_products: 'true',
		})

		Sentry.setContext('Transactions Fetch', {
			count: transactions.length,
		})

		Sentry.addBreadcrumb({
			category: 'sync',
			data: { count: transactions.length },
			level: 'info',
			message: `Found ${transactions.length} transactions to sync`,
		})

		// eslint-disable-next-line no-console
		console.log(`Found ${transactions.length} transactions to sync`)

		// Fetch existing transactions from D1 for the same date range
		const existingTransactions = await database
			.prepare(
				`SELECT transaction_id, client_id, table_id, payed_sum, status, processing_status, pay_type, products, date_created, date_close
				FROM transactions
				WHERE date_created >= ?1`,
			)
			.bind(formatApiDate(last30DaysAgo))
			.all<
				Omit<TransactionData, 'products'> & {
					products: string
				}
			>()

		// Create a map for quick lookups and change detection
		// Parse products JSON string into object for proper comparison
		const existingMap = new Map<number, TransactionData>()
		for (const tx of existingTransactions.results) {
			let parsedProducts: TransactionData['products']
			try {
				parsedProducts = tx.products
					? (JSON.parse(tx.products) as TransactionData['products'])
					: undefined
			} catch {
				parsedProducts = undefined
			}

			existingMap.set(tx.transaction_id, {
				...tx,
				products: parsedProducts,
			})
		}

		// Track changes
		const created: TransactionData[] = []
		const updated: TransactionData[] = []

		let synced = 0
		let errors = 0
		const failedTransactions: number[] = []

		// Process transactions in batches to avoid overwhelming the API
		await batchProcess(
			transactions,
			async (transaction) => {
				try {
					const transactionId = Number.parseInt(transaction.transaction_id)
					const existingTransaction = existingMap.get(transactionId)

					// Prepare data for database
					// Convert client_id of 0 to null (indicates no customer associated)
					const clientId = transaction.client_id
					const transactionData = {
						client_id:
							clientId === '0' || !clientId ? null : Number.parseInt(clientId),
						date_close:
							new Date(Number.parseInt(transaction.date_close)).toISOString() ||
							null,
						// Use date_create from API response, fallback to existing or current time
						date_created:
							existingTransaction?.date_created ||
							transaction.date_create ||
							new Date().toISOString(),
						pay_type: transaction.pay_type
							? Number.parseInt(transaction.pay_type)
							: null,
						payed_sum: Number.parseInt(transaction.payed_sum) / 100,
						processing_status: Number.parseInt(
							transaction.processing_status,
							10,
						),
						products: transaction.products ?? [],
						status: Number.parseInt(transaction.status),
						table_id: transaction.table_id
							? Number.parseInt(transaction.table_id)
							: null,
						transaction_id: transactionId,
					} satisfies TransactionData

					// Check if this is a new transaction or an update
					const isNew = !existingTransaction
					const isUpdated =
						existingTransaction &&
						(existingTransaction.client_id !== transactionData.client_id ||
							existingTransaction.table_id !== transactionData.table_id ||
							existingTransaction.payed_sum !== transactionData.payed_sum ||
							existingTransaction.status !== transactionData.status ||
							existingTransaction.processing_status !==
								transactionData.processing_status ||
							existingTransaction.pay_type !== transactionData.pay_type ||
							JSON.stringify(existingTransaction.products) !==
								JSON.stringify(transactionData.products) ||
							existingTransaction.date_close !== transactionData.date_close)

					// Upsert transaction into D1
					await database
						.prepare(
							`
						INSERT INTO transactions (transaction_id, client_id, table_id, payed_sum, status, processing_status, pay_type, products, date_created, date_close, date_updated, synced_at)
						VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
						ON CONFLICT(transaction_id) DO UPDATE SET
							client_id = excluded.client_id,
							table_id = excluded.table_id,
							payed_sum = excluded.payed_sum,
							status = excluded.status,
							processing_status = excluded.processing_status,
							pay_type = excluded.pay_type,
							products = excluded.products,
							date_created = excluded.date_created,
							date_close = excluded.date_close,
							date_updated = CURRENT_TIMESTAMP,
							synced_at = CURRENT_TIMESTAMP
					`,
						)
						.bind(
							transactionData.transaction_id,
							transactionData.client_id,
							transactionData.table_id,
							transactionData.payed_sum,
							transactionData.status,
							transactionData.processing_status,
							transactionData.pay_type,
							JSON.stringify(transactionData.products),
							transactionData.date_created,
							transactionData.date_close,
						)
						.run()

					// Track the change type
					if (isNew) {
						created.push(transactionData)

						// Notify Apple Wallet Pass of new transaction (affects wallet balance)
						if (transactionData.client_id) {
							try {
								const passUpdateResult = await notifyPassUpdate(
									transactionData.client_id,
									database,
									environment,
								)

								if (passUpdateResult.deviceCount > 0) {
									Sentry.addBreadcrumb({
										category: 'pass-update',
										data: {
											clientId: transactionData.client_id,
											deviceCount: passUpdateResult.deviceCount,
											failed: passUpdateResult.failed,
											successful: passUpdateResult.successful,
											transactionId: transactionData.transaction_id,
										},
										level: 'info',
										message:
											'Pass update notification sent for new transaction',
									})
								}
							} catch (error) {
								// Don't fail transaction sync if pass notification fails
								Sentry.captureException(error, {
									contexts: {
										passUpdate: {
											clientId: transactionData.client_id,
											transactionId: transactionData.transaction_id,
										},
									},
									level: 'warning',
									tags: {
										operation: 'pass_notification',
									},
								})
							}
						}
					} else if (isUpdated) {
						updated.push(transactionData)
					}

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
					failedTransactions.push(Number.parseInt(transaction.transaction_id))
					errors++

					Sentry.addBreadcrumb({
						category: 'sync',
						data: {
							error: error instanceof Error ? error.message : String(error),
							transaction_id: transaction,
						},
						level: 'error',
						message: `Failed to sync transaction ${transaction.transaction_id}`,
					})

					Sentry.captureException(error, {
						contexts: {
							transaction: {
								transaction_id: transaction.transaction_id,
							},
						},
						level: 'error',
						tags: {
							operation: 'transaction_sync',
						},
					})

					// eslint-disable-next-line no-console
					console.error(
						`Error syncing transaction ${transaction.transaction_id}:`,
						error,
					)
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

		const duration = Date.now() - startTime

		Sentry.setContext('Sync Results', {
			created: created.length,
			duration_ms: duration,
			errors,
			synced,
			updated: updated.length,
		})

		if (errors > 0) {
			Sentry.captureMessage(
				`Sync completed with ${errors} errors out of ${synced + errors} transactions`,
				'warning',
			)
		}

		Sentry.addBreadcrumb({
			category: 'sync',
			data: {
				created: created.length,
				duration_ms: duration,
				errors,
				synced,
				updated: updated.length,
			},
			level: 'info',
			message: 'Sync completed successfully',
		})

		return { created, errors, synced, updated }
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
	}
}

/**
 * Batch process items with concurrency control
 */
async function batchProcess<ItemT, ResultT>(
	items: ItemT[],
	processor: (item: ItemT) => Promise<ResultT>,
	concurrency = 10,
): Promise<ResultT[]> {
	const results: ResultT[] = []
	for (let index = 0; index < items.length; index += concurrency) {
		const batch = items.slice(index, index + concurrency)
		const batchResults = await Promise.all(batch.map((item) => processor(item)))
		results.push(...batchResults)
	}
	return results
}

function formatApiDate(date: Date): string {
	return date.toISOString().replace(/T.*/, '')
}
