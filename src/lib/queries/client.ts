import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

import type { RedeemClientData } from '~common/api'

export const redeemClientQueryOptions = (clientId: null | string) =>
	queryOptions<null | RedeemClientData>({
		enabled: Boolean(clientId),
		gcTime: 0,
		queryFn: () =>
			clientId ? (api.client.get(clientId) as Promise<RedeemClientData>) : null,
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
