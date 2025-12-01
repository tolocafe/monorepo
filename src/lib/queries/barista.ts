import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

import type { DashTransaction } from '@/lib/api'

export const baristaQueueQueryOptions = queryOptions<DashTransaction[]>({
	initialData: [],
	queryFn: () => api.orders.baristaQueue(),
	queryKey: ['barista', 'queue'],
	refetchOnWindowFocus: true, // Refetch immediately when window regains focus
	staleTime: 0, // Always consider data stale to ensure fresh data
})
