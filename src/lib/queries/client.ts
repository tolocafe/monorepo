import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

export type RedeemClientData = {
	birthday?: string
	canRedeemBirthday: boolean
	client_groups_name?: string
	client_id: string
	firstname: string
	lastname: string
	phone: string
	points: number
}

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
