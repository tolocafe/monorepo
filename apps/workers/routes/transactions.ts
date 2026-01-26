import * as Sentry from '@sentry/cloudflare'
import type { Product } from '@tolo/common/api'
import {
	AddTransactionProductsSchema,
	CreateEWallettransactionSchema,
	CreateStripeTransactionSchema,
	CreateTableTransactionSchema,
} from '@tolo/common/schemas'
import { getProductTotalCost } from '@tolo/common/utils'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import type { Bindings } from '../types'
import HttpStatusCode from '../utils/http-codes'
import { authenticate } from '../utils/jwt'
import { posterApi } from '../utils/poster'
import { getStripe } from '../utils/stripe'

const transactions: Hono<{ Bindings: Bindings }> = new Hono<{
	Bindings: Bindings
}>()
	.get('/active', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		try {
			// Get open transactions for this client
			const clientTransactions = await posterApi.dash.getTransactions(
				context.env.POSTER_TOKEN,
				{
					id: clientId.toString(),
					service_mode: '1', // Dine-in only
					status: '1', // Open transactions only
					type: 'clients',
				},
			)

			// Return the most recent active transaction, or null if none
			const activeTransaction = clientTransactions.at(0) ?? null

			return context.json({ transaction: activeTransaction })
		} catch (error) {
			Sentry.captureException(error)
			throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
				message: 'Failed to get active transaction',
			})
		}
	})
	.get('/:id', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)
		const transactionId = context.req.param('id')

		try {
			const transaction = await posterApi.dash.getTransaction(
				context.env.POSTER_TOKEN,
				transactionId,
				{ include_products: 'true' },
			)

			if (!transaction) {
				throw new HTTPException(HttpStatusCode.NOT_FOUND, {
					message: 'Transaction not found',
				})
			}

			// Verify the transaction belongs to the authenticated client
			if (transaction.client_id !== clientId.toString()) {
				throw new HTTPException(HttpStatusCode.FORBIDDEN, {
					message: 'Access denied',
				})
			}

			return context.json(transaction)
		} catch (error) {
			if (error instanceof HTTPException) {
				throw error
			}

			Sentry.captureException(error)
			throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
				message: 'Failed to get transaction',
			})
		}
	})
	.post('/:id/products', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)
		const transactionId = context.req.param('id')
		const spotTabletId = 1

		const body = AddTransactionProductsSchema.parse(
			(await context.req.json()) as unknown,
		)

		try {
			// Fetch transaction details and product data in parallel
			const [transaction, ...productsData] = await Promise.all([
				posterApi.dash.getTransaction(context.env.POSTER_TOKEN, transactionId),
				...body.products.map((product) =>
					posterApi.menu.getProduct(
						context.env.POSTER_TOKEN,
						product.product_id,
					),
				),
			])

			if (!transaction) {
				throw new HTTPException(HttpStatusCode.NOT_FOUND, {
					message: 'Transaction not found',
				})
			}

			if (transaction.client_id !== clientId.toString()) {
				throw new HTTPException(HttpStatusCode.FORBIDDEN, {
					message: 'Access denied',
				})
			}

			// Add each product to the transaction
			for await (const product of body.products) {
				// const modificationIds = product.modification?.map((m) => m.m) ?? []

				const productData = productsData.find(
					(p) => p.product_id === product.product_id,
				) as Product

				const price = getProductTotalCost({
					modifications:
						product.modification?.reduce(
							(accumulator, current) => {
								accumulator[current.m] = current.a
								return accumulator
							},
							{} as Record<string, number>,
						) ?? {},
					product: productData,
					quantity: product.count,
				})

				const data = {
					count: product.count,
					guest_number: 1,
					modification: JSON.stringify([]),
					modificator_id: product.modificator_id,
					price,
					product_id: product.product_id,
					spot_id: Number(transaction.spot_id),
					spot_tablet_id: spotTabletId,
					transaction_id: Number(transactionId),
				}

				// oxlint-disable-next-line no-console
				Sentry.captureMessage('Adding product to transaction', {
				extra: {
					data,
				},
				level: 'debug',
			})

				await posterApi.transactions.addTransactionProduct(
					context.env.POSTER_TOKEN,
					data,
				)
			}

			return context.json({ success: true })
		} catch (error) {
			if (error instanceof HTTPException) {
				throw error
			}

			Sentry.captureException(error)
			throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
				message:
					error instanceof Error
						? error.message
						: 'Failed to add products to transaction',
			})
		}
	})
	.post('/payment-intent', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const body = CreateStripeTransactionSchema.parse(
			(await context.req.json()) as unknown,
		)

		const stripe = getStripe(context.env.STRIPE_SECRET_KEY)

		let stripeCustomer = await stripe.customers
			.search({
				query: `metadata['poster_client_id']:'${clientId}'`,
			})
			.then((response) => response.data.at(0))

		const posterCustomer = await posterApi.clients.getClient(
			context.env.POSTER_TOKEN,
			clientId.toString(),
		)

		if (
			posterCustomer?.ewallet === null ||
			posterCustomer?.ewallet === undefined
		) {
			throw new HTTPException(400, { message: 'Client has no e-wallet' })
		}

		stripeCustomer ??= await stripe.customers.create({
			email: posterCustomer.email,
			metadata: { poster_client_id: clientId },
			name: posterCustomer.name,
			phone: posterCustomer.phone,
		})

		const [ephemeralKey, paymentIntent] = await Promise.all([
			stripe.ephemeralKeys.create(
				{ customer: stripeCustomer.id },
				{ apiVersion: '2025-07-30.basil' },
			),
			stripe.paymentIntents.create({
				amount: body.amount,
				confirmation_method: 'automatic',
				currency: 'mxn',
				customer: stripeCustomer.id,
				metadata: { poster_client_id: clientId },
			}),
		])

		return context.json({ ephemeralKey, paymentIntent })
	})
	.post('/e-wallet', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const body = CreateEWallettransactionSchema.parse(
			(await context.req.json()) as unknown,
		)

		const transactionId = await posterApi.clients.addEWalletTransaction(
			context.env.POSTER_TOKEN,
			{
				amount: body.amount,
				client_id: clientId,
			},
		)

		return context.json({ id: transactionId })
	})
	.post('/table', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const body = CreateTableTransactionSchema.parse(
			(await context.req.json()) as unknown,
		)

		const spotId = 1
		const spotTabletId = 1
		const locationId = 1
		const userId = 12

		try {
			const transaction = await posterApi.transactions.createTransaction(
				context.env.POSTER_TOKEN,
				{
					guests_count: body.guests_count,
					spot_id: spotId,
					spot_tablet_id: spotTabletId,
					table_id: Number(body.table_id),
					user_id: userId,
				},
			)

			// Associate the customer with the transaction
			await posterApi.transactions.changeClient(context.env.POSTER_TOKEN, {
				client_id: clientId,
				location_id: locationId,
				spot_id: spotId,
				spot_tablet_id: spotTabletId,
				transaction_id: transaction.transaction_id,
			})

			return context.json({
				transaction_id: transaction.transaction_id,
			})
		} catch (error) {
			Sentry.captureException(error)
			throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
				message:
					error instanceof Error
						? error.message
						: 'Failed to create table transaction',
			})
		}
	})

export default transactions
