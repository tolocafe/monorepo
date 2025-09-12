import { mutationOptions, queryOptions } from '@tanstack/react-query'

import type {
	CreateEWalletTransaction,
	CreateOrder,
	CreateStripeTransaction,
} from '@common/schemas'

import { api } from '@/lib/services/api-service'

export type CreateOrderResponse = {
	date_start: string
	order_id: string
	pay_type: string
	/** 10: Open, 20: Preparing, 30: Ready, 40: En route, 50: Delivered, 60: Closed, 70: Deleted */
	processing_status: '10' | '20' | '30' | '40' | '50' | '60' | '70'
	status: string
	sum: number
	transaction_id: string
}[]

export const createOrderMutationOptions = mutationOptions({
	mutationFn: (data: CreateOrder) => api.orders.create(data),
})

export const createEWalletTransactionMutationOptions = mutationOptions({
	mutationFn: (data: CreateEWalletTransaction) =>
		api.transactions.createEWalletTransaction(data),
})

export const createStripeTransactionMutationOptions = mutationOptions({
	mutationFn: (data: CreateStripeTransaction) =>
		api.transactions.createStripeTransaction(data),
})

export const orderQueryOptions = queryOptions({
	queryFn: () => api.orders.list(),
	queryKey: ['orders'],
})

export type FormattedCreateOrderResponse = Omit<
	CreateOrderResponse,
	'order'
> & {
	order: CreateOrderResponse & { sumFormatted: string }
}

export function formatCreateOrderResponse(response: CreateOrderResponse) {
	return response
}
