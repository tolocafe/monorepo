import * as AWS from '@aws-sdk/client-sns'
import { getCurrentScope } from '@sentry/cloudflare'

import type {
	Category,
	ClientData,
	DashTransaction,
	PosterResponse,
	Product,
	UpdateClientBody,
} from '@common/api'
import type { CreateOrder } from '@common/schemas'

const snsClient = new AWS.SNS({
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
	region: 'us-east-1',
})

const BASE_URL = 'https://joinposter.com/api'

const defaultGetMenuProductsOptions = { type: 'products' } as const

class PosterError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'PosterError'
	}
}

export async function posterFetch<TResponse = unknown>(
	url: string,
	options: RequestInit & { defaultErrorMessage?: string },
) {
	const currentScope = getCurrentScope()

	currentScope.setContext('Fetch Request', {
		Body: options.body,
		Method: options.method,
		URL: `${BASE_URL}${url}`,
	})

	const data = (await fetch(`${BASE_URL}${url}`, options).then(
		(response) => response.json() as unknown,
	)) as PosterResponse<TResponse>

	currentScope.setContext('Fetch Response', { Data: data })

	if (data.response != null) {
		return data.response
	}

	throw new PosterError(
		data.error || options.defaultErrorMessage || 'Failed to fetch data',
	)
}

function getCleanedParameters(
	parameters?: Record<string, boolean | number | string | undefined>,
) {
	const filteredParameters = Object.entries(parameters ?? {}).filter(
		([_, value]) => value != null,
	)

	const stringParameters = filteredParameters.map(([key, value]) => [
		key,
		(value as boolean | number | string).toString(),
	])

	return Object.fromEntries(stringParameters) as Record<string, string>
}

function getSearchParameters(
	parameters?: Record<string, boolean | number | string | undefined>,
) {
	return new URLSearchParams(getCleanedParameters(parameters))
}

export const api = {
	clients: {
		addEWalletPayment(
			token: string,
			body: {
				amount: number
				client_id: number
				transaction_id?: number
				type: 1 | 2
			},
		) {
			const finalBody = { ...body, amount: body.amount / 100 }

			return posterFetch<string>(`/clients.addEWalletPayment?token=${token}`, {
				body: JSON.stringify(finalBody),
				defaultErrorMessage: 'Failed to add e-wallet payment',
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			})
		},
		/**
		 * Registers a new e-wallet transaction to the client's e-wallet
		 */
		addEWalletTransaction(
			token: string,
			body: {
				/** Amount in cents */
				amount: number
				client_id: number
			},
		) {
			const parsedBody = {
				amount: body.amount / 100,
				client_id: body.client_id,
			}

			return posterFetch<number>(
				`/clients.addEWalletTransaction?token=${token}`,
				{
					body: JSON.stringify(parsedBody),
					defaultErrorMessage: 'Failed to add e-wallet transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},
		createClient(
			token: string,
			body: {
				birthday?: string
				bonus?: number
				client_groups_id_client: number
				client_name?: string
				client_sex?: number
				email?: string
				phone: string
			},
		) {
			return posterFetch<number>(`/clients.createClient?token=${token}`, {
				body: JSON.stringify(body),
				defaultErrorMessage: 'Failed to create client',
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			})
		},
		getClient(token: string, phone: string) {
			return posterFetch<ClientData[]>(
				`/clients.getClients?token=${token}&phone=${encodeURIComponent(phone)}&num=1`,
				{
					defaultErrorMessage: 'Failed to get client',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
				.then((response) => response.at(0) ?? null)
				.catch(() => null)
		},
		getClientById(token: string, id: number) {
			return posterFetch<ClientData[]>(
				`/clients.getClient?${new URLSearchParams({ client_id: id.toString(), token })}`,
				{
					defaultErrorMessage: 'Failed to get client',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
				.then((response) => response.at(0) ?? null)
				.catch(() => null)
		},
		getClients(
			token: string,
			{
				num: number_ = 100,
				offset = 0,
			}: { num?: number; offset?: number } = {},
		) {
			return posterFetch<ClientData[]>(
				`/clients.getClients?${new URLSearchParams({ num: number_.toString(), offset: offset.toString(), token })}`,
				{
					defaultErrorMessage: 'Failed to get clients',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
		},
		updateClient(token: string, clientId: number, body: UpdateClientBody) {
			return posterFetch<number>(
				`/clients.updateClient?${new URLSearchParams({ token })}`,
				{
					body: JSON.stringify({ ...body, client_id: clientId }),
					defaultErrorMessage: 'Failed to update client',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},
	},
	dash: {
		getTransaction(
			token: string,
			id: string,
			options?: { include_history?: 'true'; include_products?: 'true' },
		) {
			return posterFetch<
				{
					client_id: string
					payed_sum: string
					products?: {
						num: string
						product_id: string
						product_price: string
					}[]
					round_sum: string
					sum: string
					tax_sum: string
					tip_sum: string
				}[]
			>(
				`/dash.getTransaction?${new URLSearchParams({
					token,
					transaction_id: id,
					...options,
				})}`,
				{
					defaultErrorMessage: 'Failed to get transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			).then((response) => response.at(0) ?? null)
		},
		getTransactions(
			token: string,
			options?: {
				date_from?: string
				date_to?: string
				id?: string
				include_history?: 'true'
				include_products?: 'true'
				status?: 'close' | 'open'
				type?: 'clients' | 'spots' | 'waiters'
			},
		) {
			return posterFetch<DashTransaction[]>(
				`/dash.getTransactions?${getSearchParameters({ token, ...options })}`,
				{ defaultErrorMessage: 'Failed to get transactions' },
			)
		},
	},
	finance: {
		/** @returns The created transaction ID */
		createTransaction(
			token: string,
			body: {
				account_to: 1
				/** Amount in cents */
				amount_to: number
				/** Category ID */
				category: number
				comment?: string
				date: string
				/** Group ID */
				id: number
				/** Transaction type: 0 — expenditure, 1 — income, 2 — transfer */
				type: 1
				user_id: number
			},
		) {
			return posterFetch<number>(
				`/finance.createTransactions?${new URLSearchParams({ token })}`,
				{
					body: JSON.stringify({ ...body, amount_to: body.amount_to / 100 }),
					defaultErrorMessage: 'Failed to create transactions',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},
		getTransaction(token: string, id: string) {
			return posterFetch<
				{
					amount: string
					client_id: string
					transaction_id: string
					user_id: string
				}[]
			>(
				`/finance.getTransaction?${new URLSearchParams({ token, transaction_id: id })}`,
				{
					defaultErrorMessage: 'Failed to get transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			).then((response) => response.at(0) ?? null)
		},
	},
	incomingOrders: {
		createIncomingOrder(
			token: string,
			{
				serviceMode,
				...body
			}: Omit<CreateOrder, 'payment'> & {
				payment: { sum: string; type: 1 }
			},
			clientId: number,
		) {
			const finalOrderData = {
				...body,
				client_id: clientId,
				service_mode: serviceMode,
				spot_id: 1,
			}

			// https://dev.joinposter.com/en/docs/v3/web/incomingOrders/createIncomingOrder?id=incomingorderscreateincomingorder-response-parameters
			return posterFetch<{
				/** Online order ID */
				incoming_order_id: number
				/** Order status: 0—new, 1—accepted, 7—canceled */
				status: number
				/** Associated order ID */
				transaction_id: number
			}>(
				`/incomingOrders.createIncomingOrder?${getSearchParameters({ token })}`,
				{
					body: JSON.stringify(finalOrderData),
					defaultErrorMessage: 'Failed to create order',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},
		async getIncomingOrder(token: string, id: string) {
			const data = (await fetch(
				`${BASE_URL}/incomingOrders.getIncomingOrder?${getSearchParameters({ incoming_order_id: id, token })}`,
			).then((response) => response.json())) as PosterResponse<{
				client_id: number
				products: unknown[]
			}>

			if (data.response != null) return data.response

			getCurrentScope().setExtra('Fetch Data', data)

			throw new Error('Failed to get incoming order')
		},
	},
	menu: {
		async getMenuCategories(token: string) {
			const data = (await fetch(
				`${BASE_URL}/menu.getCategories?${getSearchParameters({ token })}`,
			).then((response) => response.json())) as PosterResponse<Category[]>

			if (data.response != null) return data.response

			throw new Error('Failed to get menu categories')
		},
		async getMenuProducts(
			token: string,
			_options: {
				type: 'categories' | 'products'
			} = defaultGetMenuProductsOptions,
		) {
			return posterFetch<Product[]>(
				`/menu.getProducts?${getSearchParameters({ token })}`,
				{
					defaultErrorMessage: 'Failed to get menu products',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
		},

		async getProduct(token: string, id: string) {
			return posterFetch<Product>(
				`/menu.getProduct?${getSearchParameters({ product_id: id, token })}`,
				{
					defaultErrorMessage: 'Failed to get product',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
		},
	},
	transactions: {
		async updateTransaction(
			token: string,
			body: {
				/** Order ID */
				orderId: number
				/** Transaction ID to update */
				transactionId: number
				/** User ID */
				userId: number
			},
		) {
			const parsedBody = {
				account_from: body.orderId,
				amount_to: 0,
				comment: 'eWallet payment',
				transaction_id: body.transactionId,
				/** Transaction type: 0—expenditure, 1—income, 2—transfer */
				type: 1,
				user_id: body.userId,
			}

			return posterFetch<number>(
				`/finance.updateTransactions?${new URLSearchParams({ token })}`,
				{
					body: JSON.stringify(parsedBody),
					defaultErrorMessage: 'Failed to update transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},
	},
}

export async function closePosterOrder(
	token: string,
	body: {
		payed_cert: number
		transaction_id: number
	},
) {
	return posterFetch<number>(
		`/transactions.closeTransaction?${new URLSearchParams({ token })}`,
		{
			body: JSON.stringify({ ...body, spot_id: 1, spot_tablet_id: 1 }),
			defaultErrorMessage: 'Failed to close order',
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
		},
	)
}

export async function sendSms(_token: string, phone: string, message: string) {
	return snsClient.send(
		new AWS.PublishCommand({ Message: message, PhoneNumber: phone }),
	)
}
