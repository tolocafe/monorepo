import { mutationOptions, queryOptions } from '@tanstack/react-query'

import type {
	CreateEWalletTransaction,
	CreateOrder,
	CreateStripeTransaction,
} from '@common/schemas'

import { api } from '@/lib/services/api-service'

import type { Order } from '@/lib/stores/order-store'

export type CreateOrderRequest = {
	client_address?: string
	client_name?: string
	comment?: string
	payment: {
		sum: number
		type: 'card' | 'cash' | 'online'
	}
	phone?: string
	products: {
		count: number
		modifications?: {
			count: number
			modification_id: string
		}[]
		price?: number
		product_id: string
	}[]
	service_mode?: '1' | '2' | '3' // 1 = table service, 2 = takeaway, 3 = delivery
}

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

export function convertOrderToApiFormat(order: Order): CreateOrderRequest {
	return {
		comment: order.customerNote,
		payment: {
			sum: 0, // Server will calculate the total
			type: 'cash',
		},
		products: order.products.map((item) => ({
			count: item.quantity,
			// Price will be calculated by the server based on product_id
			modifications: item.modifications?.map((module_) => ({
				count: 1,
				modification_id: module_.id,
			})),
			product_id: item.id,
		})),
		service_mode: '2', // takeaway by default
	}
}

export function formatCreateOrderResponse(response: CreateOrderResponse) {
	return response
}
