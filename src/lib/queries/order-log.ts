import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

/** Query options for fetching order log with frequent polling (10 seconds) */
export const orderLogQueryOptions = queryOptions({
	queryFn: () => api.orders.log(),
	queryKey: ['orders', 'log'],
	refetchInterval: 10_000, // Refresh every 10 seconds
	staleTime: 5000, // Consider data stale after 5 seconds
})

/** Client groups that have access to internal features (team members) */
export const INTERNAL_GROUPS = new Set([8, 9])
