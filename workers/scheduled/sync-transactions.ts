import * as Sentry from '@sentry/cloudflare'
import { api } from 'workers/utils/poster'

export type SyncResult = {
	created: TransactionData[]
	deleted: string[]
	errors: number
	synced: number
	updated: TransactionData[]
}

type TransactionData = {
	client_id: string
	date_close: string
	date_created: string
	pay_type: number
	payed_sum: string
	products?: {
		num: string
		product_id: string
		product_sum: string
	}[]
	table_id: number
	transaction_id: string
}

/**
 * Sync transaction data from Poster to D1
 */
export default async function syncTransactions(
	token: string,
	database: D1Database,
) {
	const startTime = Date.now()

	try {
		const startTime = Date.now()

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

		// Fetch transaction IDs from Poster
		const transactions = await api.transactions.getTransactions(token, {
			date_from: formatApiDate(last30DaysAgo),
			date_to: formatApiDate(today),
			per_page: 1000,
		})

		Sentry.setContext('Transactions Fetch', {
			count: transactions.count,
		})

		Sentry.addBreadcrumb({
			category: 'sync',
			data: { count: transactions.count },
			level: 'info',
			message: `Found ${transactions.count} transactions to sync`,
		})

		// eslint-disable-next-line no-console
		console.log(`Found ${transactions.count} transactions to sync`)

		// Fetch existing transactions from D1 for the same date range
		const existingTransactions = await database
			.prepare(
				`SELECT transaction_id, client_id, payed_sum, products, date_created, date_close, table_id, pay_type
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
		const existingMap = new Map<string, TransactionData>()
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

		// Track transaction IDs from Poster
		const posterTransactionIds = new Set(
			transactions.data.map((t) => t.transaction_id.toString()),
		)

		// Track changes
		const created: TransactionData[] = []
		const updated: TransactionData[] = []
		const deleted: string[] = []

		let synced = 0
		let errors = 0
		const failedTransactions: number[] = []

		// Process transactions in batches to avoid overwhelming the API
		await batchProcess(
			transactions.data,
			async (transaction) => {
				try {
					const transactionId = transaction.transaction_id.toString()
					const existingTransaction = existingMap.get(transactionId)

					// Prepare data for database
					const transactionData = {
						client_id: transaction.client_id.toString(),
						date_close: transaction.date_close,
						date_created:
							existingTransaction?.date_created || new Date().toISOString(),
						pay_type: transaction.pay_type,
						payed_sum: transaction.payed_sum,
						products: transaction.products,
						table_id: transaction.table_id,
						transaction_id: transactionId,
					} satisfies TransactionData

					// Check if this is a new transaction or an update
					const isNew = !existingTransaction
					const isUpdated =
						existingTransaction &&
						(existingTransaction.client_id !== transactionData.client_id ||
							existingTransaction.payed_sum !== transactionData.payed_sum ||
							existingTransaction.date_close !== transactionData.date_close ||
							existingTransaction.table_id !== transactionData.table_id ||
							existingTransaction.pay_type !== transactionData.pay_type ||
							JSON.stringify(existingTransaction.products) !==
								JSON.stringify(transactionData.products))

					// Upsert transaction into D1
					await database
						.prepare(
							`
						INSERT INTO transactions (transaction_id, client_id, payed_sum, products, date_created, date_close, table_id, pay_type, date_updated, synced_at)
						VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
						ON CONFLICT(transaction_id) DO UPDATE SET
							client_id = excluded.client_id,
							payed_sum = excluded.payed_sum,
							products = excluded.products,
							date_close = excluded.date_close,
							table_id = excluded.table_id,
							pay_type = excluded.pay_type,
							date_updated = CURRENT_TIMESTAMP,
							synced_at = CURRENT_TIMESTAMP
					`,
						)
						.bind(
							transactionData.transaction_id,
							transactionData.client_id,
							transactionData.payed_sum,
							JSON.stringify(transactionData.products),
							transactionData.date_created,
							transactionData.date_close,
							transactionData.table_id,
							transactionData.pay_type,
						)
						.run()

					// Track the change type
					if (isNew) {
						created.push(transactionData)
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
					failedTransactions.push(transaction.transaction_id)
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

		// Find deleted transactions (in D1 but not in Poster response)
		for (const existingTx of existingTransactions.results) {
			if (!posterTransactionIds.has(existingTx.transaction_id)) {
				deleted.push(existingTx.transaction_id)
			}
		}

		// Delete transactions that are no longer in Poster
		if (deleted.length > 0) {
			await database
				.prepare(
					`DELETE FROM transactions WHERE transaction_id IN (${deleted.map(() => '?').join(',')})`,
				)
				.bind(...deleted)
				.run()
		}

		if (failedTransactions.length > 0) {
			Sentry.setContext('Failed Transactions', {
				count: failedTransactions.length,
				ids: failedTransactions.slice(0, 50), // Only log first 50 to avoid bloat
			})
		}

		const duration = Date.now() - startTime

		Sentry.setContext('Sync Results', {
			created: created.length,
			deleted: deleted.length,
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
				deleted: deleted.length,
				duration_ms: duration,
				errors,
				synced,
				updated: updated.length,
			},
			level: 'info',
			message: 'Sync completed successfully',
		})

		// eslint-disable-next-line no-console
		console.log(
			`Sync completed: ${synced} synced (${created.length} new, ${updated.length} updated, ${deleted.length} deleted), ${errors} errors in ${duration}ms`,
		)

		return {
			created,
			deleted,
			errors,
			synced,
			updated,
		}
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
