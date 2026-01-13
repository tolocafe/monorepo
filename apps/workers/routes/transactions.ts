import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import {
	CreateEWallettransactionSchema,
	CreateStripeTransactionSchema,
} from '~common/schemas'

import type { Bindings } from '../types'
import { authenticate } from '../utils/jwt'
import { posterApi } from '../utils/poster'
import { getStripe } from '../utils/stripe'

const transactions = new Hono<{ Bindings: Bindings }>()
	.post('/payment-intent', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const body = CreateStripeTransactionSchema.parse(
			(await c.req.json()) as unknown,
		)

		const stripe = getStripe(c.env.STRIPE_SECRET_KEY)

		let stripeCustomer = await stripe.customers
			.search({
				query: `metadata['poster_client_id']:'${clientId}'`,
			})
			.then((response) => response.data.at(0))

		const posterCustomer = await posterApi.clients.getClient(
			c.env.POSTER_TOKEN,
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

		return c.json({ ephemeralKey, paymentIntent })
	})
	.post('/e-wallet', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const body = CreateEWallettransactionSchema.parse(
			(await c.req.json()) as unknown,
		)

		const transactionId = await posterApi.clients.addEWalletTransaction(
			c.env.POSTER_TOKEN,
			{
				amount: body.amount,
				client_id: clientId,
			},
		)

		return c.json({ id: transactionId })
	})

export default transactions
