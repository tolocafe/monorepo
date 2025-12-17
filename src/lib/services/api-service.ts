import type {
	Category,
	ClientData,
	Coffee,
	DashTransaction,
	Event,
	Product,
	Promotion,
	TableBill,
} from '@/lib/api'
import type { RequestOtpMutationOptions } from '@/lib/queries/auth'
import type {
	CreateOrderResponse,
	OrderDetailResponse,
} from '@/lib/queries/order'
import type {
	CreateEWalletTransaction,
	CreateOrder,
	CreateStripeTransaction,
} from '~common/schemas'

import { privateClient, publicClient } from './http-client'

/**
 * API service object with methods for making HTTP requests
 * Uses public client for auth/menu endpoints, private client for user-specific endpoints
 */
export const api = {
	auth: {
		requestOtp: (body: RequestOtpMutationOptions) =>
			publicClient
				.post<{ error: string } | { success: true }>('auth/request-otp', {
					json: body,
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
		get: (clientId: string) =>
			privateClient.get<ClientData>(`clients/${clientId}`).json(),
		redeem: (clientId: string, type: 'birthday' | 'visits') =>
			privateClient
				.post<{
					message: string
					redemption: { createdAt: string; id: number }
				}>(`clients/${clientId}/redeem`, { json: { type } })
				.json(),
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

	coffees: {
		getCoffee: (slug: string) =>
			publicClient.get<Coffee>(`coffees/${slug}`).json(),
		getCoffees: () => publicClient.get<Coffee[]>('coffees').json(),
	},

	events: {
		getEvent: (slug: string) =>
			publicClient.get<Event>(`events/${slug}`).json(),
		getEvents: () => publicClient.get<Event[]>('events').json(),
	},

	get: (endpoint: string) => privateClient.get(endpoint).json(),

	menu: {
		getCategories: () => publicClient.get<Category[]>('menu/categories').json(),
		getProduct: (productId: string) =>
			publicClient.get<Product>(`menu/products/${productId}`).json(),
		getProducts: () => publicClient.get<Product[]>('menu/products').json(),
		getPromotions: () =>
			publicClient.get<Promotion[]>('menu/promotions').json(),
	},

	orders: {
		baristaQueue: () =>
			privateClient.get<DashTransaction[]>('orders/barista/queue').json(),
		create: (orderData: CreateOrder) =>
			privateClient
				.post<CreateOrderResponse>('orders', { json: orderData })
				.json(),
		downloadReceipt: (orderId: string) =>
			privateClient.get(`receipts/${orderId}`, { timeout: 30_000 }).blob(),
		get: (orderId: string) =>
			privateClient.get<OrderDetailResponse>(`orders/${orderId}`).json(),
		list: () => privateClient.get<CreateOrderResponse>('orders').json(),
	},

	// Generic methods for other endpoints
	post: (endpoint: string, data: unknown) =>
		privateClient.post(endpoint, { json: data }).json(),

	tables: {
		createPaymentIntent: (locationId: string, tableId: string) =>
			publicClient
				.post<{
					paymentIntent: { client_secret: string }
				}>(`tables/${locationId}/${tableId}/payment-intent`)
				.json(),
		get: (locationId: string, tableId: string) =>
			publicClient.get<TableBill>(`tables/${locationId}/${tableId}`).json(),
		pay: async (
			locationId: string,
			tableId: string,
			data: { paymentIntentId: string; phone?: string },
		) => {
			// Try to get auth token for authenticated requests
			const token = await import('./http-client').then((m) => m.getAuthToken())

			return publicClient
				.post<{ success: true; transactionId: string }>(
					`tables/${locationId}/${tableId}/pay`,
					{
						headers: token ? { Authorization: `Bearer ${token}` } : {},
						json: data,
					},
				)
				.json()
		},
	},

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
