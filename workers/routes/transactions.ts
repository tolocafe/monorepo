import {
	CreateEWallettransactionSchema,
	CreateStripeTransactionSchema,
} from '@common/schemas'
import { Hono } from 'hono'

import { stripe } from '../stripe'
import { authenticate } from '../utils/jwt'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

const transactions = new Hono<{ Bindings: Bindings }>()
	.post('/payment-intent', async (c) => {
		const clientId = await authenticate(c, c.env.JWT_SECRET)

		const body = CreateStripeTransactionSchema.parse(
			(await c.req.json()) as unknown,
		)

		let customer = await stripe.customers
			.search({
				query: `metadata['poster_client_id']:'${clientId}'`,
			})
			.then((response) => response.data.at(0))

		customer ??= await stripe.customers.create({
			metadata: { poster_client_id: clientId },
		})

		const [ephemeralKey, paymentIntent] = await Promise.all([
			stripe.ephemeralKeys.create(
				{ customer: customer.id },
				{ apiVersion: '2025-07-30.basil' },
			),
			stripe.paymentIntents.create({
				amount: body.amount,
				currency: 'mxn',
				customer: customer.id,
				metadata: { poster_client_id: clientId },
			}),
		])

		return c.json({ ephemeralKey, paymentIntent })
	})
	.post('/e-wallet', async (c) => {
		const clientId = await authenticate(c, c.env.JWT_SECRET)

		const body = CreateEWallettransactionSchema.parse(
			(await c.req.json()) as unknown,
		)

		const transactionId = await api.clients.addEWalletTransaction(
			c.env.POSTER_TOKEN,
			{ amount: body.amount, client_id: clientId },
		)

		return c.json({ id: transactionId })
	})

export default transactions
