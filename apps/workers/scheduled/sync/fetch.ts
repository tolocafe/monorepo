import { api } from '~workers/utils/poster'

import type { DashTransaction } from '~common/api'

import { formatApiDate } from './utils'

/**
 * Fetch transactions for a date range with automatic pagination/chunking.
 * Splits large date ranges into smaller chunks to avoid API limits and memory issues.
 */
export async function fetchTransactionsPaginated(
	token: string,
	dateFrom: Date,
	dateTo: Date,
	options?: {
		/** Maximum days per chunk (default: 30) */
		chunkDays?: number
		/** Maximum transactions per chunk before splitting further */
		maxTransactionsPerChunk?: number
	},
): Promise<DashTransaction[]> {
	const chunkDays = options?.chunkDays ?? 30
	const maxTransactionsPerChunk = options?.maxTransactionsPerChunk ?? 1000

	const totalDays = Math.ceil(
		(dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24),
	)

	// If range is small enough, fetch directly
	if (totalDays <= chunkDays) {
		// eslint-disable-next-line no-console
		console.log(
			`[fetchTransactionsPaginated] Fetching ${totalDays} days directly (${formatApiDate(dateFrom)} to ${formatApiDate(dateTo)})...`,
		)
		const startFetch = Date.now()
		const fetched = await api.dash.getTransactions(token, {
			date_from: formatApiDate(dateFrom),
			date_to: formatApiDate(dateTo),
			include_products: 'true',
		})
		const fetchDuration = Date.now() - startFetch
		// eslint-disable-next-line no-console
		console.log(
			`[fetchTransactionsPaginated] Fetched ${fetched.length} transactions in ${fetchDuration}ms`,
		)

		// If response is too large, split further
		if (fetched.length > maxTransactionsPerChunk && totalDays > 1) {
			// eslint-disable-next-line no-console
			console.log(
				`[fetchTransactionsPaginated] Response too large (${fetched.length} > ${maxTransactionsPerChunk}), splitting into smaller chunks...`,
			)
			const midDate = new Date(
				dateFrom.getTime() + (dateTo.getTime() - dateFrom.getTime()) / 2,
			)
			const [first, second] = await Promise.all([
				fetchTransactionsPaginated(token, dateFrom, midDate, options),
				fetchTransactionsPaginated(token, midDate, dateTo, options),
			])
			// eslint-disable-next-line no-console
			console.log(
				`[fetchTransactionsPaginated] Combined ${first.length} + ${second.length} = ${first.length + second.length} transactions`,
			)
			return [...first, ...second]
		}

		return fetched
	}

	// Split into chunks
	const numberChunks = Math.ceil(totalDays / chunkDays)
	// eslint-disable-next-line no-console
	console.log(
		`[fetchTransactionsPaginated] Splitting ${totalDays} days into ${numberChunks} chunks of ${chunkDays} days...`,
	)

	let currentFrom = new Date(dateFrom)
	const chunks: Promise<DashTransaction[]>[] = []
	let chunkIndex = 0

	while (currentFrom < dateTo) {
		const currentTo = new Date(
			Math.min(
				currentFrom.getTime() + chunkDays * 24 * 60 * 60 * 1000,
				dateTo.getTime(),
			),
		)

		// eslint-disable-next-line no-console
		console.log(
			`[fetchTransactionsPaginated] Chunk ${chunkIndex + 1}/${numberChunks}: ${formatApiDate(currentFrom)} to ${formatApiDate(currentTo)}`,
		)

		chunks.push(
			fetchTransactionsPaginated(token, currentFrom, currentTo, options),
		)

		currentFrom = new Date(currentTo.getTime() + 1) // Start next chunk 1ms after previous
		chunkIndex++
	}

	const startChunks = Date.now()
	const results = await Promise.all(chunks)
	const chunksDuration = Date.now() - startChunks
	const totalFetched = results.reduce((sum, chunk) => sum + chunk.length, 0)
	// eslint-disable-next-line no-console
	console.log(
		`[fetchTransactionsPaginated] Completed ${numberChunks} chunks: ${totalFetched} total transactions in ${chunksDuration}ms`,
	)
	return results.flat()
}
