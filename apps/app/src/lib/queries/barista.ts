import { queryOptions } from '@tanstack/react-query'
import type { DashTransaction } from '@tolo/common/api'

import { api } from '@/lib/services/api-service'

export const baristaQueueQueryOptions = queryOptions<DashTransaction[]>({
	initialData: [],
	queryFn: () => api.orders.baristaQueue(),
	queryKey: ['barista', 'queue'] as const,
	refetchOnWindowFocus: true, // Refetch immediately when window regains focus
	staleTime: 0, // Always consider data stale to ensure fresh data
})
