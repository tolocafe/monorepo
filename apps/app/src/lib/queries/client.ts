import { mutationOptions, queryOptions } from '@tanstack/react-query'
import type { RedeemClientData } from '@tolo/common/api'

import { api } from '@/lib/services/api-service'

export const redeemClientQueryOptions = (clientId: null | string) =>
	queryOptions<null | RedeemClientData>({
		enabled: Boolean(clientId),
		gcTime: 0,
		queryFn: () =>
			api.client.get(clientId as string) as Promise<RedeemClientData>,
		queryKey: ['redeem-client', clientId],
		retry: false,
		staleTime: 0,
	})

export const redeemDrinkMutationOptions = mutationOptions({
	mutationFn: ({
		clientId,
		type,
	}: {
		clientId: string
		type: 'birthday' | 'visits'
	}) => api.client.redeem(clientId, type),
})
