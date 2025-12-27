import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

import type { DashTransaction, QueueItemState } from '@/lib/api'

export const baristaQueueQueryOptions = queryOptions<DashTransaction[]>({
	initialData: [],
	queryFn: () => api.orders.baristaQueue(),
	queryKey: ['barista', 'queue'] as const,
	refetchOnWindowFocus: true, // Refetch immediately when window regains focus
	staleTime: 0, // Always consider data stale to ensure fresh data
})

export const baristaQueueStatesQueryOptions = queryOptions<QueueItemState[]>({
	initialData: [],
	queryFn: () => api.orders.baristaQueueStates(),
	queryKey: ['barista', 'queue', 'states'] as const,
	refetchOnWindowFocus: true,
	staleTime: 0,
})

export const updateQueueItemStateMutationOptions = mutationOptions({
	mutationFn: (data: {
		lineIndex: number
		status: 'delivered' | 'unselected' | 'working'
		transactionId: number
	}) => api.orders.updateQueueItemState(data),
	mutationKey: ['barista', 'queue', 'updateState'],
})
