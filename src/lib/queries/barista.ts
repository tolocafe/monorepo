import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

import type { DashTransaction, QueueStatesMap } from '@/lib/api'

export const baristaQueueQueryOptions = queryOptions<DashTransaction[]>({
	initialData: [],
	queryFn: () => api.orders.baristaQueue(),
	queryKey: ['barista', 'queue'] as const,
	refetchOnWindowFocus: true, // Refetch immediately when window regains focus
	staleTime: 0, // Always consider data stale to ensure fresh data
})

export function baristaQueueStatesQueryOptions(transactionIds: number[]) {
	return queryOptions<QueueStatesMap>({
		enabled: transactionIds.length > 0,
		initialData: {},
		queryFn: () => api.orders.baristaQueueStates(transactionIds),
		queryKey: ['barista', 'queue', 'states', transactionIds] as const,
		refetchOnWindowFocus: true,
		staleTime: 0,
	})
}

export const updateQueueItemStateMutationOptions = mutationOptions({
	mutationFn: (data: {
		lineIndex: number
		status: 'delivered' | 'unselected' | 'working'
		transactionId: number
	}) => api.orders.updateQueueItemState(data),
	mutationKey: ['barista', 'queue', 'updateState'],
})
