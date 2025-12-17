import { mutationOptions, queryOptions } from '@tanstack/react-query'

import type {
	CreateEWalletTransaction,
	CreateOrder,
	CreateStripeTransaction,
} from '@common/schemas'

import { queryClient } from '@/lib/query-client'
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

export type OrderDetailResponse = {
	client_id: string
	date_start: string
	/** Percentage */
	discount?: string
	payed_sum: string
	processing_status: number
	products?: {
		num: string
		product_id: string
		product_price: string
	}[]
	round_sum: string
	sum: string
	tax_sum: string
	tip_sum: string
}

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

export const orderDetailQueryOptions = (orderId: string) =>
	queryOptions({
		initialData: () => {
			const orders = queryClient.getQueryData(orderQueryOptions.queryKey)
			const order = orders?.find((order) => order.transaction_id === orderId)

			// Convert the list order format to detail format if found
			if (order) {
				return {
					client_id: '',
					date_start: order.date_start,
					payed_sum: order.sum.toString(),
					processing_status: Number(order.processing_status),
					products: [],
					round_sum: '0',
					sum: order.sum.toString(),
					tax_sum: '0',
					tip_sum: '0',
				} as OrderDetailResponse
			}

			return
		},
		queryFn: () => api.orders.get(orderId),
		queryKey: ['orders', orderId],
	})
