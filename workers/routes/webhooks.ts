import { captureEvent } from '@sentry/cloudflare'
import { captureException } from '@sentry/react-native'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod/v4'

import { stripe } from '../stripe'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

const posterWebhookDataSchema = z.object({
	account: z.string().optional(),
	account_number: z.string().optional(),
	action: z.string().optional(),
	data: z.string().optional(),
	object: z.string().optional(),
	object_id: z.union([z.number(), z.string()]).optional(),
	time: z.string().optional(),
	verify: z.string(),
})

const webhooks = new Hono<{ Bindings: Bindings }>()
	.get('/poster', (c) => c.json({ message: 'Ok' }, 200))
	.post('/stripe', async (c) => {
		const sig = c.req.header('stripe-signature')

		if (!sig) {
			throw new HTTPException(400, { message: 'Missing signature' })
		}

		let event

		try {
			const body = await c.req.text()

			event = stripe.webhooks.constructEvent(
				body,
				sig,
				c.env.STRIPE_WEBHOOK_SECRET,
			)

			captureEvent({
				extra: { event },
				message: 'Stripe webhook received',
			})
		} catch (error) {
			captureException(error)

			throw new HTTPException(400, {
				message: `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			})
		}

		// Handle the event
		switch (event.type) {
			case 'payment_intent.succeeded': {
				const paymentIntent = event.data.object

				captureEvent({
					extra: { paymentIntent },
					message: 'Stripe payment intent succeeded',
				})

				// Get the customer and their Poster client ID
				const customer = await stripe.customers.retrieve(
					paymentIntent.customer as string,
				)

				if (customer.deleted) {
					throw new HTTPException(400, { message: 'Customer was deleted' })
				}

				const posterClientId = customer.metadata.poster_client_id

				if (!posterClientId) {
					throw new HTTPException(400, {
						message: 'No Poster client ID found in customer metadata',
					})
				}

				// Create e-wallet transaction in Poster
				const transactionId = await api.clients.addEWalletTransaction(
					c.env.POSTER_TOKEN,
					{
						amount: paymentIntent.amount, // Amount is already in cents
						client_id: Number(posterClientId),
					},
				)

				// Store the transaction mapping in D1
				await c.env.D1_TOLO.exec(
					'CREATE TABLE IF NOT EXISTS top_ups (payment_intent_id TEXT PRIMARY KEY, client_id INTEGER, amount INTEGER, transaction_id INTEGER, created_at TIMESTAMP)',
				)

				await c.env.D1_TOLO.prepare(
					'INSERT INTO top_ups (payment_intent_id, client_id, amount, transaction_id, created_at) VALUES (?, ?, ?, ?, ?)',
				)
					.bind(
						paymentIntent.id,
						Number(posterClientId),
						paymentIntent.amount,
						transactionId,
						new Date().toISOString(),
					)
					.run()

				break
			}
			default:
				// Unhandled event type
				break
		}

		return c.json({ received: true })
	})
	.post('/poster', async (context) => {
		const body = (await context.req.json()) as unknown

		const parsedBody = posterWebhookDataSchema.parse(body)

		if (parsedBody.verify !== process.env.POSTER_APPLICATION_SECRET) {
			if (parsedBody.action === 'test') {
				return context.json({ message: 'Ok' }, 200)
			}

			return context.json({ message: 'Invalid signature' }, 401)
		}

		captureEvent({
			extra: { body: parsedBody },
			message: 'Poster webhook received',
		})

		const { action, data } = parsedBody

		let parsedData
		if (data) {
			try {
				parsedData = JSON.parse(data) as object
			} catch {
				//
			}
		}

		switch (action) {
			case 'added':
				if (parsedData && 'user_id' in parsedData) {
					// eslint-disable-next-line no-console
					console.log({ user_id: parsedData.user_id })
				}
				return context.json({ message: 'Ok' }, 200)
			default:
				return context.json({ message: 'Ok' }, 200)
		}
	})

export default webhooks
