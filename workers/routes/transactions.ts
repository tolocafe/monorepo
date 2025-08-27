import {
	CreateEWallettransactionSchema,
	CreateStripeTransactionSchema,
} from '@common/schemas'
import { Hono } from 'hono'

import { authenticate } from '../utils/jwt'
import { api } from '../utils/poster'
import { getStripe } from '../utils/stripe'

import type { Bindings } from '../types'

const transactions = new Hono<{ Bindings: Bindings }>()
	.post('/payment-intent', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const body = CreateStripeTransactionSchema.parse(
			(await c.req.json()) as unknown,
		)

		const stripe = getStripe(c.env.STRIPE_SECRET_KEY)

		let customer = await stripe.customers
			.search({
				query: `metadata['poster_client_id']:'${clientId}'`,
			})
			.then((response) => response.data.at(0))

		if (!customer) {
			const posterCustomer = await api.clients.getClient(
				c.env.POSTER_TOKEN,
				clientId.toString(),
			)

			customer = await stripe.customers.create({
				email: posterCustomer?.email,
				metadata: { poster_client_id: clientId },
				name: posterCustomer?.name,
				phone: posterCustomer?.phone,
			})
		}

		const [ephemeralKey, paymentIntent] = await Promise.all([
			stripe.ephemeralKeys.create(
				{ customer: customer.id },
				{ apiVersion: '2025-07-30.basil' },
			),
			stripe.paymentIntents.create({
				amount: body.amount,
				confirmation_method: 'automatic',
				currency: 'mxn',
				customer: customer.id,
				metadata: { poster_client_id: clientId },
			}),
		])

		return c.json({ ephemeralKey, paymentIntent })
	})
	.post('/e-wallet', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

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
