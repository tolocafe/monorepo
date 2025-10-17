import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

/**
 * Query options for fetching user transactions
 */
export const transactionsQueryOptions = queryOptions({
	queryFn: () => api.orders.list(),
	queryKey: ['transactions'],
	staleTime: 1000 * 60 * 5, // 5 minutes
})
