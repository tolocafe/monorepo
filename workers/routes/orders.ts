import { CreateOrderSchema } from '@common/schemas'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { authenticate } from '../utils/jwt'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

const orders = new Hono<{ Bindings: Bindings }>()
	.get('/', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const orders = await api.dash.getTransactions(c.env.POSTER_TOKEN, clientId)

		return c.json(orders)
	})
	.post('/', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const body = (await context.req.json()) as unknown

		if (typeof body !== 'object' || body === null || Array.isArray(body)) {
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
			const transactionId = await api.clients.addEWalletTransaction(
				context.env.POSTER_TOKEN,
				{ amount: paymentAmount, client_id: clientId },
			)

			const order = await api.incomingOrders.createIncomingOrder(
				context.env.POSTER_TOKEN,
				{
					...parsedBody,
					payment: { sum: paymentAmount.toString(), type: 1 },
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
			throw new HTTPException(500, {
				message:
					error instanceof Error ? error.message : 'Failed to create order',
			})
		}
	})

export default orders
