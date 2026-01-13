import type { DashTransaction } from '~common/api'
import { posterApi } from '~workers/utils/poster'

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
		const fetched = await posterApi.dash.getTransactions(token, {
			date_from: formatApiDate(dateFrom),
			date_to: formatApiDate(dateTo),
			include_history: 'true',
			include_products: 'true',
		})

		// If response is too large, split further
		if (fetched.length > maxTransactionsPerChunk && totalDays > 1) {
			const midDate = new Date(
				dateFrom.getTime() + (dateTo.getTime() - dateFrom.getTime()) / 2,
			)
			const [first, second] = await Promise.all([
				fetchTransactionsPaginated(token, dateFrom, midDate, options),
				fetchTransactionsPaginated(token, midDate, dateTo, options),
			])
			return [...first, ...second]
		}

		return fetched
	}

	// Split into chunks
	let currentFrom = new Date(dateFrom)
	const chunks: Promise<DashTransaction[]>[] = []

	while (currentFrom < dateTo) {
		const currentTo = new Date(
			Math.min(
				currentFrom.getTime() + chunkDays * 24 * 60 * 60 * 1000,
				dateTo.getTime(),
			),
		)

		chunks.push(
			fetchTransactionsPaginated(token, currentFrom, currentTo, options),
		)

		currentFrom = new Date(currentTo.getTime() + 1)
	}

	const results = await Promise.all(chunks)
	return results.flat()
}
