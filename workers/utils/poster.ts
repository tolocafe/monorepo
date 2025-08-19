import * as AWS from '@aws-sdk/client-sns'

import type { Category, ClientData, PosterResponse, Product } from '@common/api'
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

export const api = {
	clients: {
		async addEWalletPayment(
			token: string,
			body: {
				amount: number
				client_id: string
				transaction_id: number
			},
		) {
			const data = (await fetch(
				`${BASE_URL}/clients.addEWalletPayment?token=${token}`,
				{
					body: JSON.stringify({ ...body, amount: body.amount / 100, type: 2 }),
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			).then((response) => response.json())) as PosterResponse<string>

			if (data.response != null) return data.response

			throw new Error('Failed to add e-wallet payment')
		},
		/**
		 * Registers a new e-wallet transaction to the client's e-wallet
		 */
		async addEWalletTransaction(
			token: string,
			body: {
				/** Amount in cents */
				amount: number
				client_id: number
			},
		) {
			const parsedBody = { ...body, amount: body.amount / 100 }

			// eslint-disable-next-line no-console
			console.log('ADD E-WALLET TRANSACTION')

			// eslint-disable-next-line no-console
			console.log(parsedBody)

			const data = (await fetch(
				`${BASE_URL}/clients.addEWalletTransaction?token=${token}`,
				{
					body: JSON.stringify(parsedBody),
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			).then((response) => response.json())) as PosterResponse<number>

			// eslint-disable-next-line no-console
			console.log('ADD E-WALLET TRANSACTION RESPONSE')
			// eslint-disable-next-line no-console
			console.log(data)

			if (data.response != null) return data.response

			throw new Error('Failed to add e-wallet transaction')
		},
		async createClient(token: string, body: Record<string, unknown>) {
			const data = (await fetch(
				`${BASE_URL}/clients.createClient?token=${token}`,
				{
					body: JSON.stringify(body),
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			).then((response) => response.json())) as PosterResponse<number>

			if (data.response != null) return data.response

			throw new Error('Failed to create client')
		},
		async getClient(token: string, phone: string) {
			const response = (await fetch(
				`${BASE_URL}/clients.getClients?token=${token}&phone=${encodeURIComponent(phone)}&num=1`,
			).then((response) => response.json())) as PosterResponse<ClientData[]>

			if (response.response != null) return response.response.at(0)

			return null
		},
		async getClientById(token: string, id: number) {
			const data = (await fetch(
				`${BASE_URL}/clients.getClient?token=${token}&client_id=${id}`,
			).then((response) => response.json())) as PosterResponse<ClientData[]>

			if (data.response != null) return data.response.at(0)

			return null
		},
		async updateClient(
			token: string,
			clientId: string,
			body: Record<string, unknown>,
		) {
			const data = (await fetch(
				`${BASE_URL}/clients.updateClient?token=${token}`,
				{
					body: JSON.stringify({ ...body, client_id: clientId }),
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			).then((response) => response.json())) as PosterResponse<number>

			if (data.response) return data.response

			throw new Error('Failed to update client')
		},
	},
	dash: {
		async getTransaction(token: string, id: string) {
			// eslint-disable-next-line no-console
			console.log('GET TRANSACTION')

			const data = (await fetch(
				`${BASE_URL}/dash.getTransaction?token=${token}&transaction_id=${id}`,
			).then((response) => response.json())) as PosterResponse<
				{
					/** The amount paid by hard cash which is equal to the payed_cash amount plus payed_card */
					payed_sum: string
					/** Receipt rounding amount in cents */
					round_sum: string
					/** Total order amount, without discounts, in cents */
					sum: string
				}[]
			>

			// eslint-disable-next-line no-console
			console.log('GET TRANSACTION RESPONSE')
			// eslint-disable-next-line no-console
			console.log(data)

			const transaction = data.response?.at(0)

			if (transaction) {
				return transaction
			}

			throw new Error('Failed to get transaction')
		},
		async getTransactions(token: string, clientId: number) {
			const data = (await fetch(
				`${BASE_URL}/dash.getTransactions?token=${token}&type=clients&id=${clientId}&include_x=true`,
			).then((response) => response.json())) as PosterResponse<number[]>

			if (data.response != null) return data.response

			return []
		},
	},
	finance: {
		async getTransaction(token: string, id: string) {
			const data = (await fetch(
				`${BASE_URL}/finance.getTransaction?token=${token}&transaction_id=${id}`,
			).then((response) => response.json())) as PosterResponse<
				{
					amount: string
					transaction_id: string
				}[]
			>
			// eslint-disable-next-line no-console
			console.log('GET TRANSACTION RESPONSE')
			// eslint-disable-next-line no-console
			console.log(data)

			const transaction = data.response?.at(0)

			if (transaction) return transaction

			throw new Error('Failed to get transaction')
		},
	},
	incomingOrders: {
		async createIncomingOrder(
			token: string,
			body: Omit<CreateOrder, 'payment'> & {
				payment: { sum: string; type: 1 }
			},
			clientId: number,
		) {
			// eslint-disable-next-line no-console
			console.log('CREATE ORDER')
			// eslint-disable-next-line no-console
			console.log(JSON.stringify({ body }, null, 2))

			const finalOrderData = {
				...body,
				client_id: clientId,
				service_mode: 2,
				spot_id: 1,
			}

			// https://dev.joinposter.com/en/docs/v3/web/incomingOrders/createIncomingOrder?id=incomingorderscreateincomingorder-response-parameters
			const data = (await fetch(
				`${BASE_URL}/incomingOrders.createIncomingOrder?token=${token}`,
				{
					body: JSON.stringify(finalOrderData),
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			).then((response) => response.json())) as PosterResponse<{
				/** Online order ID */
				incoming_order_id: number
				/** Order status: 0—new, 1—accepted, 7—canceled */
				status: number
				/** Associated order ID */
				transaction_id: number
			}>

			// eslint-disable-next-line no-console
			console.log('CREATE ORDER RESPONSE')
			// eslint-disable-next-line no-console
			console.log(data)

			if (data.response != null) {
				return data.response
			}

			throw new Error(data.error || 'Failed to create order')
		},
	},
	menu: {
		async getMenuCategories(token: string) {
			const data = (await fetch(
				`${BASE_URL}/menu.getCategories?token=${token}`,
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
			return fetch(`${BASE_URL}/menu.getProducts?token=${token}`)
				.then(
					(response) => response.json() as Promise<PosterResponse<Product[]>>,
				)
				.then((data) => data.response)
		},

		async getProduct(token: string, id: string) {
			const data = (await fetch(
				`${BASE_URL}/menu.getProduct?token=${token}&product_id=${id}`,
			).then((response) => response.json())) as PosterResponse<Product>

			if (data.response != null) return data.response

			throw new Error('Failed to get product')
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

			// eslint-disable-next-line no-console
			console.log('UPDATE TRANSACTION BODY')
			// eslint-disable-next-line no-console
			console.log(parsedBody)

			const data = (await fetch(
				`${BASE_URL}/finance.updateTransactions?token=${token}`,
				{
					body: JSON.stringify(parsedBody),
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			).then((response) => response.json())) as PosterResponse<number>

			// eslint-disable-next-line no-console
			console.log('UPDATE TRANSACTION RESPONSE')
			// eslint-disable-next-line no-console
			console.log(data)

			if (data.response != null) return data.response

			throw new Error('Failed to update transaction')
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
	// eslint-disable-next-line no-console
	console.log('CLOSE ORDER')
	// eslint-disable-next-line no-console
	console.log(body)

	const data = (await fetch(
		`${BASE_URL}/transactions.closeTransaction?token=${token}`,
		{
			body: JSON.stringify({ ...body, spot_id: 1, spot_tablet_id: 1 }),
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
		},
	).then((response) => response.json())) as PosterResponse<number>

	if (data.response != null) return data.response

	// eslint-disable-next-line no-console
	console.log('CLOSE ORDER ERROR')
	// eslint-disable-next-line no-console
	console.log(data)

	throw new Error('Failed to close order')
}

export async function sendSms(_token: string, phone: string, message: string) {
	return snsClient.send(
		new AWS.PublishCommand({ Message: message, PhoneNumber: phone }),
	)
}
