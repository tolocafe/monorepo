import { CreateOrderSchema } from '@common/schemas'
import { getProductTotalCost } from '@common/utils'
import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { authenticate } from 'workers/utils/jwt'
import { api } from 'workers/utils/poster'

import type { Product } from '@common/api'
import type { Bindings } from 'workers/types'

const orders = new Hono<{ Bindings: Bindings }>()
	.get('/', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const orders = await api.dash.getTransactions(c.env.POSTER_TOKEN, clientId)

		return c.json(orders)
	})
	.post('/', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const body = (await context.req.json()) as unknown

		if (typeof body !== 'object' || body == null) {
			throw new HTTPException(400, { message: 'Invalid body' })
		}

		try {
			const parsedBody = CreateOrderSchema.parse({
				...body,
				client_id: clientId,
			})
			const paymentAmount = parsedBody.payment.amount

			/*
			 * Verify e-wallet transaction, if customer does not have enough balance,
			 * the transaction will fail and the order will not be created
			 */
			const [transactionId, ...products] = await Promise.all([
				api.clients.addEWalletTransaction(context.env.POSTER_TOKEN, {
					amount: paymentAmount,
					client_id: clientId,
				}),
				...parsedBody.products.map((product) =>
					api.menu.getProduct(context.env.POSTER_TOKEN, product.product_id),
				),
			])

			const order = await api.incomingOrders.createIncomingOrder(
				context.env.POSTER_TOKEN,
				{
					...parsedBody,
					payment: { sum: paymentAmount.toString(), type: 1 },
					products: parsedBody.products.map((product) => {
						const productData = products.find(
							(p) => p.product_id === product.product_id,
						) as Product

						return {
							...product,
							price: getProductTotalCost({
								modifications:
									product.modification?.reduce(
										(accumulator, current) => {
											accumulator[current.m] = current.a
											return accumulator
										},
										{} as Record<string, number>,
									) ?? {},
								product: productData,
							}),
						}
					}),
				},
				clientId,
			)

			await context.env.D1_TOLO.exec(
				'CREATE TABLE IF NOT EXISTS wallet_orders (transaction_id INTEGER, order_id INTEGER, client_id INTEGER, amount INTEGER)',
			)

			await context.env.D1_TOLO.prepare(
				'INSERT INTO wallet_orders (transaction_id, order_id, client_id, amount) VALUES (?, ?, ?, ?)',
			)
				.bind(transactionId, order.incoming_order_id, clientId, paymentAmount)
				.run()

			return context.json(order)
		} catch (error) {
			captureException(error)

			throw new HTTPException(500, {
				message:
					error instanceof Error ? error.message : 'Failed to create order',
			})
		}
	})

export default orders
