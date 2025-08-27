import crypto from 'node:crypto'

import {
	captureEvent,
	captureException,
	getCurrentScope,
} from '@sentry/cloudflare'
import { Expo } from 'expo-server-sdk'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod/v4'

import type { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'

import { api } from '../utils/poster'
import { getStripe } from '../utils/stripe'

import type { Bindings } from '../types'

type EventData =
	| undefined
	| {
			transactions_history?: { type_history: 'changedeliveryinfo' | 'comment' }
	  }
	| { transactions_history?: { value: number } }

const posterWebhookDataSchema = z.object({
	account: z.string().optional(),
	account_number: z.string().optional(),
	action: z
		.enum(['changed', 'closed', 'added', 'removed', 'transformed', 'test'])
		.optional(),
	data: z.string().optional(),
	object: z.string().optional(),
	object_id: z.union([z.number(), z.string()]).optional(),
	time: z.string().optional(),
	verify: z.string(),
})

const webhooks = new Hono<{ Bindings: Bindings }>()
	.get('/poster', (context) => context.json({ message: 'Ok' }, 200))
	.post('/stripe', async (context) => {
		const signature = context.req.header('stripe-signature')

		if (!signature) {
			throw new HTTPException(400, { message: 'Missing signature' })
		}

		const stripe = getStripe(context.env.STRIPE_SECRET_KEY)

		let event
		try {
			const body = await context.req.text()

			event = await stripe.webhooks.constructEventAsync(
				body,
				signature,
				context.env.STRIPE_WEBHOOK_SECRET,
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
			case 'payment_intent.created': {
				captureEvent({
					extra: { paymentIntent: event.data.object },
					level: 'debug',
					message: 'Stripe payment intent created',
				})
				break
			}
			case 'payment_intent.payment_failed': {
				captureEvent({
					extra: { paymentIntent: event.data.object },
					level: 'error',
					message: 'Stripe payment intent failed',
				})
				break
			}
			case 'payment_intent.processing': {
				captureEvent({
					extra: { paymentIntent: event.data.object },
					level: 'debug',
					message: 'Stripe payment intent processing',
				})
				break
			}
			case 'payment_intent.requires_action': {
				captureEvent({
					extra: { paymentIntent: event.data.object },
					level: 'warning',
					message: 'Stripe payment intent requires action',
				})
				break
			}
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

				// Store the transaction mapping in D1
				await context.env.D1_TOLO.exec(
					'CREATE TABLE IF NOT EXISTS top_ups (payment_intent_id TEXT PRIMARY KEY, client_id INTEGER, amount INTEGER, transaction_id INTEGER, created_at TIMESTAMP)',
				)

				// Verify transaction does not exist in top_ups table
				const transaction = await context.env.D1_TOLO.prepare(
					'SELECT * FROM top_ups WHERE payment_intent_id = ?',
				)
					.bind(paymentIntent.id)
					.first()

				if (transaction) {
					captureEvent({
						extra: { transaction },
						message: 'Transaction was already processed',
					})

					return context.json({ received: true })
				}

				try {
					const transactionId = await api.finance.createTransaction(
						context.env.POSTER_TOKEN,
						{
							account_to: 1,
							amount_to: 0,
							category: 14,
							date: new Date(event.data.object.created * 1000)
								.toISOString()
								.replace('T', ' ')
								.split('.')
								.at(0) as string,
							id: 1,
							type: 1,
							user_id: Number(posterClientId),
						},
					)

					captureEvent({
						extra: {
							amount: paymentIntent.amount,
							posterClientId,
							transactionId,
						},
						message: 'Created Poster finance transaction',
					})

					// eslint-disable-next-line unicorn/prevent-abbreviations
					const eWalletTransactionId = await api.clients.addEWalletPayment(
						context.env.POSTER_TOKEN,
						{
							amount: paymentIntent.amount,
							client_id: Number(posterClientId),
							transaction_id: transactionId,
							type: 2,
						},
					)

					captureEvent({
						extra: { eWalletTransactionId, posterClientId, transactionId },
						message: 'Added e-wallet payment',
					})

					await context.env.D1_TOLO.prepare(
						'INSERT INTO top_ups (payment_intent_id, client_id, amount, transaction_id, created_at) VALUES (?, ?, ?, ?, ?)',
					)
						.bind(
							paymentIntent.id,
							Number(posterClientId),
							paymentIntent.amount,
							eWalletTransactionId,
							new Date().toISOString(),
						)
						.run()

					captureEvent({
						extra: {
							amount: paymentIntent.amount,
							eWalletTransactionId,
							paymentIntentId: paymentIntent.id,
							posterClientId,
							processingTimeMs: Date.now() - event.data.object.created * 1000,
						},
						message: 'Successfully processed payment and updated wallet',
					})
				} catch (error) {
					captureException(error)

					captureEvent({
						extra: {
							amount: paymentIntent.amount,
							error: error instanceof Error ? error.message : 'Unknown error',
							paymentIntentId: paymentIntent.id,
							posterClientId,
						},
						level: 'error',
						message: 'Failed to process payment webhook',
					})

					// Re-throw to ensure webhook returns error status
					throw error
				}

				break
			}
			default:
				// Unhandled event type
				break
		}

		return context.json({ received: true })
	})
	.post('/poster', async (context) => {
		const body = (await context.req.json()) as unknown

		const parsedBody = posterWebhookDataSchema.parse(body)
		const { account, action, data, object, object_id, time } = parsedBody

		const verifyHash = crypto
			.createHash('md5')
			.update(
				[
					account,
					object,
					object_id,
					action,
					...(data ? [data] : []),
					time,
					context.env.POSTER_APPLICATION_SECRET,
				].join(';'),
			)
			.digest('hex')

		if (parsedBody.verify !== verifyHash) {
			if (parsedBody.action === 'test') {
				return context.json({ message: 'Ok' }, 200)
			}

			return context.json({ message: 'Invalid signature' }, 401)
		}

		let parsedData: EventData
		if (data) {
			try {
				parsedData = JSON.parse(data) as unknown as EventData
			} catch {
				//
			}
		}

		const expo = new Expo()
		const messages: ExpoPushMessage[] = []

		captureEvent({
			extra: { body, parsedData },
			level: 'debug',
			message: `Poster webhook received (${object})`,
		})

		switch (object) {
			case 'incoming_order': {
				const { client_id } = await api.incomingOrders.getIncomingOrder(
					context.env.POSTER_TOKEN,
					object_id as string,
				)
				const { results: pushTokens } = await context.env.D1_TOLO.prepare(
					'SELECT * FROM push_tokens WHERE client_id = ?',
				)
					.bind(client_id)
					.all()

				if (action === 'closed') {
					messages.push(
						...pushTokens.map(
							(destination) =>
								({
									body: 'Disfruta tu pedido ☕️🥐, esperamos que lo disfrutes!',
									title: 'Pedido entregado',
									to: destination.token as string,
								}) satisfies ExpoPushMessage,
						),
					)
					break
				}

				if (action === 'changed') {
					const incomingOrder = await api.incomingOrders.getIncomingOrder(
						context.env.POSTER_TOKEN,
						object_id as string,
					)

					captureEvent({
						extra: { incomingOrder },
						level: 'debug',
						message: 'Incoming order changed',
					})
				}

				break
			}
			case 'transaction': {
				if (action === 'changed') {
					const { client_id } = await api.dash.getTransaction(
						context.env.POSTER_TOKEN,
						object_id as string,
					)

					const { results: pushTokens } = await context.env.D1_TOLO.prepare(
						'SELECT * FROM push_tokens WHERE client_id = ?',
					)
						.bind(client_id)
						.all()

					if (
						parsedData?.transactions_history &&
						'value' in parsedData.transactions_history &&
						parsedData.transactions_history.value === 4
					) {
						messages.push(
							...pushTokens.map(
								(destination) =>
									({
										body: '🚨 Comunícate con nosotros para resolverlo cuanto antes',
										title: 'Pedido no aceptado',
										to: destination.token as string,
									}) satisfies ExpoPushMessage,
							),
						)
					} else if (
						parsedData?.transactions_history &&
						'type_history' in parsedData.transactions_history &&
						parsedData.transactions_history.type_history === 'comment'
					) {
						messages.push(
							...pushTokens.map(
								(destination) =>
									({
										body: '✅ Tu pedido ya está listo, te esperamos!',
										title: 'Pedido listo',
										to: destination.token as string,
									}) satisfies ExpoPushMessage,
							),
						)
						break
					} else if (
						parsedData?.transactions_history &&
						'type_history' in parsedData.transactions_history &&
						parsedData.transactions_history.type_history ===
							'changedeliveryinfo'
					) {
						// TODO: send eta
					} else {
						messages.push(
							...pushTokens.map(
								(destination) =>
									({
										body: '🧑🏽‍🍳 Ahora estamos trabajando en tu pedido, te avisaremos cuando esté listo',
										title: 'Pedido aceptado',
										to: destination.token as string,
									}) satisfies ExpoPushMessage,
							),
						)
						break
					}
				}

				break
			}
			default: {
				break
			}
		}

		const chunks = expo.chunkPushNotifications(messages)

		const tickets: ExpoPushTicket[] = []
		for (const chunk of chunks) {
			const ticket = await expo.sendPushNotificationsAsync(chunk)
			tickets.push(...ticket)
		}

		getCurrentScope().setExtras({ ParsedData: parsedData, Tickets: tickets })

		return context.json({ message: 'Ok' }, 200)
	})

export default webhooks
