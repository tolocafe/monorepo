import type {
	CreateEWalletTransaction,
	CreateOrder,
	CreateStripeTransaction,
} from '@common/schemas'

import type { Category, ClientData, Product } from '@/lib/api'
import type { CreateOrderResponse } from '@/lib/queries/order'

import { privateClient, publicClient } from './http-client'

/**
 * API service object with methods for making HTTP requests
 * Uses public client for auth/menu endpoints, private client for user-specific endpoints
 */
export const api = {
	auth: {
		requestOtp: (phone: string, name?: string, email?: string) =>
			publicClient
				.post<{ success: true }>('auth/request-otp', {
					json: { email, name, phone },
				})
				.json(),
		self: () => privateClient.get<ClientData>('auth/self').json(),
		sessions: () =>
			privateClient
				.get<
					{ createdAt: number; name: string; token: string }[]
				>('auth/self/sessions')
				.json(),
		signOut: () =>
			privateClient.post<{ success: true }>('auth/sign-out').json(),
		verifyOtp: (phone: string, code: string, sessionName: string) =>
			publicClient
				.post<{ client: ClientData; token: string }>('auth/verify-otp', {
					json: { code, phone, sessionName },
				})
				.json(),
	},
	client: {
		update: (clientId: string, data: Record<string, unknown>) =>
			privateClient
				.put<ClientData>(`clients/${clientId}`, {
					json: data,
				})
				.json(),
		updatePushTokens: (clientId: string, data: string) =>
			privateClient
				.put<ClientData>(`clients/${clientId}/push-tokens`, {
					json: data,
				})
				.json(),
	},

	get: (endpoint: string) => privateClient.get(endpoint).json(),

	menu: {
		getCategories: () => publicClient.get<Category[]>('menu/categories').json(),
		getProduct: (productId: string) =>
			publicClient.get<Product>(`menu/products/${productId}`).json(),
		getProducts: () => publicClient.get<Product[]>('menu/products').json(),
	},

	orders: {
		create: (orderData: CreateOrder) =>
			privateClient
				.post<CreateOrderResponse>('orders', {
					json: orderData,
				})
				.json(),
		list: () => privateClient.get<CreateOrderResponse>('orders').json(),
	},

	// Generic methods for other endpoints
	post: (endpoint: string, data: unknown) =>
		privateClient.post(endpoint, { json: data }).json(),
	transactions: {
		createEWalletTransaction: (data: CreateEWalletTransaction) =>
			privateClient.post('transactions/e-wallet', { json: data }).json<{
				id: number
			}>(),
		createStripeTransaction: (data: CreateStripeTransaction) =>
			privateClient.post('transactions/payment-intent', { json: data }).json<{
				ephemeralKey: string
				paymentIntent: { client_secret: string }
			}>(),
	},
	wallet: {
		topUp: (data: { amount: number }) =>
			privateClient.post('wallet/top-up', { json: data }).json<{
				ephemeralKey: string
				paymentIntent: { client_secret: string }
			}>(),
	},
}
