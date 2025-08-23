import { captureEvent, captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod/v4'

import { api } from '../utils/poster'
import { getStripe } from '../utils/stripe'

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
		const signature = c.req.header('stripe-signature')

		if (!signature) {
			throw new HTTPException(400, { message: 'Missing signature' })
		}

		const stripe = getStripe()

		let event
		try {
			const body = await c.req.text()

			event = await stripe.webhooks.constructEventAsync(
				body,
				signature,
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

				// Store the transaction mapping in D1
				await c.env.D1_TOLO.exec(
					'CREATE TABLE IF NOT EXISTS top_ups (payment_intent_id TEXT PRIMARY KEY, client_id INTEGER, amount INTEGER, transaction_id INTEGER, created_at TIMESTAMP)',
				)

				// Verify transaction does not exist in top_ups table
				const transaction = await c.env.D1_TOLO.prepare(
					'SELECT * FROM top_ups WHERE payment_intent_id = ?',
				)
					.bind(paymentIntent.id)
					.first()

				if (transaction) {
					captureEvent({
						extra: { transaction },
						message: 'Transaction was already processed',
					})

					return c.json({ received: true })
				}

				const transactionId = await api.finance.createTransaction(
					c.env.POSTER_TOKEN,
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

				// eslint-disable-next-line unicorn/prevent-abbreviations
				const eWalletTransactionId = await api.clients.addEWalletPayment(
					c.env.POSTER_TOKEN,
					{
						amount: paymentIntent.amount,
						client_id: Number(posterClientId),
						transaction_id: transactionId,
						type: 2,
					},
				)

				await c.env.D1_TOLO.prepare(
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

		// Capture initial webhook received event with basic info
		captureEvent({
			extra: { 
				body: parsedBody,
				headers: Object.fromEntries(context.req.raw.headers.entries()),
				timestamp: new Date().toISOString()
			},
			level: 'info',
			message: 'Poster webhook received',
			tags: {
				action: parsedBody.action || 'unknown',
				object: parsedBody.object || 'unknown',
				webhook_type: 'poster'
			}
		})

		if (parsedBody.verify !== process.env.POSTER_APPLICATION_SECRET) {
			if (parsedBody.action === 'test') {
				captureEvent({
					extra: { body: parsedBody },
					level: 'info',
					message: 'Poster webhook test action received',
					tags: {
						action: 'test',
						webhook_type: 'poster'
					}
				})
				return context.json({ message: 'Ok' }, 200)
			}

			// Capture authentication failure
			captureEvent({
				extra: { 
					body: parsedBody,
					expected_signature_exists: !!process.env.POSTER_APPLICATION_SECRET
				},
				level: 'warning',
				message: 'Poster webhook authentication failed',
				tags: {
					action: parsedBody.action || 'unknown',
					error_type: 'authentication_failure',
					webhook_type: 'poster'
				}
			})

			return context.json({ message: 'Invalid signature' }, 401)
		}

		const { action, data } = parsedBody

		let parsedData
		if (data) {
			try {
				parsedData = JSON.parse(data) as object
				
				// Capture successful data parsing
				captureEvent({
					extra: { 
						parsedData,
						originalData: data,
						dataType: typeof parsedData,
						dataKeys: Object.keys(parsedData)
					},
					level: 'debug',
					message: 'Poster webhook data parsed successfully',
					tags: {
						action: action || 'unknown',
						has_parsed_data: 'true',
						webhook_type: 'poster'
					}
				})
			} catch (parseError) {
				// Capture data parsing failure
				captureEvent({
					extra: { 
						data,
						parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
						action: action || 'unknown'
					},
					level: 'warning',
					message: 'Poster webhook data parsing failed',
					tags: {
						action: action || 'unknown',
						error_type: 'data_parse_failure',
						webhook_type: 'poster'
					}
				})
			}
		} else {
			// Capture when no data is provided
			captureEvent({
				extra: { body: parsedBody },
				level: 'info',
				message: 'Poster webhook received without data field',
				tags: {
					action: action || 'unknown',
					has_data: 'false',
					webhook_type: 'poster'
				}
			})
		}

		switch (action) {
			case 'added':
				if (parsedData && 'user_id' in parsedData) {
					// Capture successful user addition event
					captureEvent({
						extra: { 
							userId: parsedData.user_id,
							parsedData,
							fullWebhookBody: parsedBody
						},
						level: 'info',
						message: 'Poster webhook: User added successfully',
						tags: {
							action: 'added',
							object_type: 'user',
							user_id: String(parsedData.user_id),
							webhook_type: 'poster'
						}
					})

					// eslint-disable-next-line no-console
					console.log({ user_id: parsedData.user_id })
				} else {
					// Capture when added action lacks expected user_id
					captureEvent({
						extra: { 
							parsedData: parsedData || null,
							expectedField: 'user_id',
							fullWebhookBody: parsedBody
						},
						level: 'warning',
						message: 'Poster webhook: Added action missing user_id',
						tags: {
							action: 'added',
							error_type: 'missing_user_id',
							webhook_type: 'poster'
						}
					})
				}
				return context.json({ message: 'Ok' }, 200)
			default:
				// Capture unhandled actions
				captureEvent({
					extra: { 
						action: action || 'undefined',
						parsedData: parsedData || null,
						fullWebhookBody: parsedBody
					},
					level: 'info',
					message: 'Poster webhook: Unhandled action received',
					tags: {
						action: action || 'unknown',
						handled: 'false',
						webhook_type: 'poster'
					}
				})
				return context.json({ message: 'Ok' }, 200)
		}
	})

export default webhooks
