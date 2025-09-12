import crypto from 'node:crypto'

import {
	addBreadcrumb,
	captureEvent,
	captureException,
	getCurrentScope,
} from '@sentry/cloudflare'
import { Expo } from 'expo-server-sdk'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { trackServerEvent } from 'workers/utils/analytics'
import { sendBatchAPNsNotifications } from 'workers/utils/apns'
import getPass from 'workers/utils/generate-pass'
import { api } from 'workers/utils/poster'
import { getStripe } from 'workers/utils/stripe'
import { z } from 'zod/v4'

import type { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'
import type { Context } from 'hono'

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
	object_id: z.union([z.string(), z.number()]).optional(),
	time: z.string().optional(),
	verify: z.string(),
})

/** Helper function to create required D1 tables */
async function ensurePassTables(database: D1Database) {
	// D1 requires sequential execution of CREATE TABLE statements
	await database.exec(`
		CREATE TABLE IF NOT EXISTS pass_auth_tokens (
			client_id INTEGER PRIMARY KEY,
			auth_token TEXT UNIQUE NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	await database.exec(`
		CREATE TABLE IF NOT EXISTS pass_registrations (
			device_library_id TEXT,
			pass_type_identifier TEXT,
			serial_number TEXT,
			client_id INTEGER,
			push_token TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (device_library_id, serial_number)
		)
	`)
	await database.exec(`
		CREATE TABLE IF NOT EXISTS pass_updates (
			serial_number TEXT PRIMARY KEY,
			pass_type_identifier TEXT,
			client_id INTEGER,
			last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
}

// Helper function to extract client ID from pass serial number
function extractClientIdFromPassId(passId: string): null | number {
	const regex = /^TOLO-(\d+)$/
	const match = regex.exec(passId)
	if (!match) return null
	return Number.parseInt(match[1], 10)
}

function getApplePassAuthToken(context: Context) {
	return context.req.header('Authorization')?.replace('ApplePass ', '')
}

// Function to send Apple Push Notifications for pass updates
async function sendPassUpdateNotification(
	context: Context<{ Bindings: Bindings }>,
	clientId: number,
) {
	try {
		const serialNumber = `TOLO-${clientId.toString().padStart(8, '0')}`

		// Ensure tables exist
		await ensurePassTables(context.env.D1_TOLO)

		// Get all devices registered for this pass
		const { results: registrations } = await context.env.D1_TOLO.prepare(
			'SELECT push_token FROM pass_registrations WHERE serial_number = ?',
		)
			.bind(serialNumber)
			.all<{ push_token: string }>()

		if (registrations.length === 0) {
			captureEvent({
				extra: { clientId, serialNumber },
				level: 'debug',
				message: 'No devices registered for pass update',
			})
			return // No devices registered for this pass
		}

		// Update the pass update timestamp
		await context.env.D1_TOLO.prepare(
			'INSERT OR REPLACE INTO pass_updates (serial_number, pass_type_identifier, client_id, last_updated) VALUES (?, ?, ?, ?)',
		)
			.bind(
				serialNumber,
				'pass.cafe.tolo.app',
				clientId,
				new Date().toISOString(),
			)
			.run()

		// Send push notifications to all registered devices via APNs
		const pushTokens = registrations.map((r) => r.push_token)

		captureEvent({
			extra: {
				clientId,
				deviceCount: registrations.length,
				pushTokens,
				serialNumber,
			},
			level: 'info',
			message: 'Pass update notification triggered - wallet balance updated',
		})

		// Send actual APNs push notifications
		const apnsResult = await sendBatchAPNsNotifications(pushTokens, context.env)

		// Log results
		captureEvent({
			extra: {
				clientId,
				deviceCount: registrations.length,
				failed: apnsResult.failed,
				results: apnsResult.results,
				serialNumber,
				successful: apnsResult.successful,
			},
			level: apnsResult.failed > 0 ? 'warning' : 'info',
			message: `APNs notifications sent: ${apnsResult.successful} successful, ${apnsResult.failed} failed`,
		})

		// Handle failed notifications (e.g., invalid tokens)
		if (apnsResult.failed > 0) {
			const invalidTokens = apnsResult.results
				.filter(
					(result) =>
						!result.success && result.error?.includes('BadDeviceToken'),
				)
				.map((result) => result.token)

			if (invalidTokens.length > 0) {
				// Remove invalid tokens from database
				for (const invalidToken of invalidTokens) {
					await context.env.D1_TOLO.prepare(
						'DELETE FROM pass_registrations WHERE push_token = ?',
					)
						.bind(invalidToken)
						.run()
				}

				captureEvent({
					extra: { clientId, invalidTokens, serialNumber },
					level: 'info',
					message: 'Removed invalid device tokens from database',
				})
			}
		}

		addBreadcrumb({
			data: {
				clientId,
				deviceCount: registrations.length,
				serialNumber,
				successfulNotifications: apnsResult.successful,
			},
			level: 'info',
			message: 'Pass update notifications completed',
		})
	} catch (error) {
		captureException(error)
		captureEvent({
			extra: {
				clientId,
				error: error instanceof Error ? error.message : 'Unknown',
				serialNumber: `TOLO-${clientId.toString().padStart(8, '0')}`,
			},
			level: 'error',
			message: 'Failed to send pass update notification',
		})
	}
}

const webhooks = new Hono<{ Bindings: Bindings }>()
	.get('/poster', (context) => context.json({ message: 'Ok' }, 200))
	.post('/passes/v1/log', (context) => {
		captureEvent({
			extra: { log: context.req.text() },
			level: 'debug',
			message: 'Passes log webhook received',
		})

		return context.json({ message: 'Ok' }, 200)
	})
	.delete(
		'/passes/v1/devices/:deviceLibraryId/registrations/:passTypeIdentifier/:passId',
		async (context) => {
			const { deviceLibraryId, passId } = context.req.param()
			const authToken = getApplePassAuthToken(context)

			if (!authToken) {
				return context.json({}, 401)
			}

			const clientId = extractClientIdFromPassId(passId)
			if (!clientId) {
				return context.json({}, 401)
			}

			try {
				// Ensure tables exist
				await ensurePassTables(context.env.D1_TOLO)

				// Validate auth token
				const authResult = await context.env.D1_TOLO.prepare(
					'SELECT * FROM pass_auth_tokens WHERE client_id = ? AND auth_token = ?',
				)
					.bind(clientId, authToken)
					.first()

				if (!authResult) {
					return context.json({}, 401)
				}

				// Delete registration
				await context.env.D1_TOLO.prepare(
					'DELETE FROM pass_registrations WHERE device_library_id = ? AND serial_number = ?',
				)
					.bind(deviceLibraryId, passId)
					.run()

				captureEvent({
					extra: { clientId, deviceLibraryId, passId },
					level: 'debug',
					message: 'Pass registration deleted',
				})

				return context.json({}, 200)
			} catch (error) {
				captureException(error)
				return context.json({}, 500)
			}
		},
	)
	.post(
		'/passes/v1/devices/:deviceLibraryId/registrations/:passTypeIdentifier/:passId',
		async (context) => {
			const { deviceLibraryId, passId, passTypeIdentifier } =
				context.req.param()
			const authToken = getApplePassAuthToken(context)

			if (!authToken) {
				return context.json({}, 401)
			}

			const clientId = extractClientIdFromPassId(passId)
			if (!clientId) {
				return context.json({}, 401)
			}

			try {
				// Ensure tables exist
				await ensurePassTables(context.env.D1_TOLO)

				// Validate auth token
				const authResult = await context.env.D1_TOLO.prepare(
					'SELECT * FROM pass_auth_tokens WHERE client_id = ? AND auth_token = ?',
				)
					.bind(clientId, authToken)
					.first()

				if (!authResult) {
					return context.json({}, 401)
				}

				const { pushToken } = await context.req.json<{ pushToken: string }>()

				// Check if already registered
				const existing = await context.env.D1_TOLO.prepare(
					'SELECT * FROM pass_registrations WHERE device_library_id = ? AND serial_number = ?',
				)
					.bind(deviceLibraryId, passId)
					.first()

				if (existing) {
					// Update push token if changed
					await context.env.D1_TOLO.prepare(
						'UPDATE pass_registrations SET push_token = ? WHERE device_library_id = ? AND serial_number = ?',
					)
						.bind(pushToken, deviceLibraryId, passId)
						.run()

					captureEvent({
						extra: { clientId, deviceLibraryId, passId, pushToken },
						level: 'debug',
						message: 'Pass registration updated',
					})

					return context.json({}, 200)
				}

				// New registration
				await context.env.D1_TOLO.prepare(
					'INSERT INTO pass_registrations (device_library_id, pass_type_identifier, serial_number, client_id, push_token, created_at) VALUES (?, ?, ?, ?, ?, ?)',
				)
					.bind(
						deviceLibraryId,
						passTypeIdentifier,
						passId,
						clientId,
						pushToken,
						new Date().toISOString(),
					)
					.run()

				captureEvent({
					extra: {
						clientId,
						deviceLibraryId,
						passId,
						passTypeIdentifier,
						pushToken,
					},
					level: 'debug',
					message: 'Pass registration created',
				})

				return context.json({}, 201)
			} catch (error) {
				captureException(error)
				return context.json({}, 500)
			}
		},
	)
	// Get serial numbers of updated passes
	.get(
		'/passes/v1/devices/:deviceLibraryId/registrations/:passTypeIdentifier',
		async (context) => {
			const { deviceLibraryId, passTypeIdentifier } = context.req.param()
			const passesUpdatedSince = context.req.query('passesUpdatedSince')

			try {
				// Ensure tables exist
				await ensurePassTables(context.env.D1_TOLO)

				let query = `
					SELECT pr.serial_number, COALESCE(pu.last_updated, pr.created_at) as last_updated
					FROM pass_registrations pr
					LEFT JOIN pass_updates pu ON pr.serial_number = pu.serial_number
					WHERE pr.device_library_id = ? AND pr.pass_type_identifier = ?
				`
				const parameters: string[] = [deviceLibraryId, passTypeIdentifier]

				if (passesUpdatedSince) {
					const sinceDate = new Date(
						Number.parseInt(passesUpdatedSince) * 1000,
					).toISOString()
					query += ' AND COALESCE(pu.last_updated, pr.created_at) > ?'
					parameters.push(sinceDate)
				}

				const { results } = await context.env.D1_TOLO.prepare(query)
					.bind(...parameters)
					.all<{ serial_number: string }>()

				if (results.length === 0) {
					return new Response(null, { status: 204 }) // No content
				}

				const serialNumbers = results.map((r) => r.serial_number)
				const lastUpdated = Math.floor(Date.now() / 1000).toString()

				captureEvent({
					extra: {
						deviceLibraryId,
						lastUpdated,
						passTypeIdentifier,
						serialNumbers,
					},
					level: 'debug',
					message: 'Pass serial numbers requested',
				})

				return context.json({
					lastUpdated,
					serialNumbers,
				})
			} catch (error) {
				captureException(error)
				return context.json({}, 500)
			}
		},
	)
	// Get latest version of a specific pass
	.get(
		'/passes/v1/passes/:passTypeIdentifier/:serialNumber',
		async (context) => {
			const { passTypeIdentifier, serialNumber } = context.req.param()
			const authToken = getApplePassAuthToken(context)

			if (!authToken) {
				return context.json({}, 401)
			}

			const clientId = extractClientIdFromPassId(serialNumber)
			if (!clientId) {
				return context.json({}, 401)
			}

			try {
				// Ensure tables exist
				await ensurePassTables(context.env.D1_TOLO)

				// Validate auth token
				const authResult = await context.env.D1_TOLO.prepare(
					'SELECT auth_token FROM pass_auth_tokens WHERE client_id = ?',
				)
					.bind(clientId)
					.first()

				if (!authResult || authResult.auth_token !== authToken) {
					return context.json({}, 401)
				}

				// Get client data
				const client = await api.clients.getClientById(
					context.env.POSTER_TOKEN,
					clientId,
				)

				if (!client) {
					return context.json({}, 404)
				}

				// Generate updated pass with the SAME auth token from database
				const pass = await getPass(context, authResult.auth_token, client)

				// Update the last_updated timestamp
				await context.env.D1_TOLO.prepare(
					'INSERT OR REPLACE INTO pass_updates (serial_number, pass_type_identifier, client_id, last_updated) VALUES (?, ?, ?, ?)',
				)
					.bind(
						serialNumber,
						passTypeIdentifier,
						clientId,
						new Date().toISOString(),
					)
					.run()

				captureEvent({
					extra: { clientId, passTypeIdentifier, serialNumber },
					level: 'debug',
					message: 'Pass delivered to device',
				})

				return new Response(pass.getAsBuffer(), {
					headers: {
						'Content-Type': 'application/vnd.apple.pkpass',
						'Last-Modified': new Date().toUTCString(),
					},
				})
			} catch (error) {
				captureException(error)
				return context.json({}, 500)
			}
		},
	)
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
				level: 'debug',
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

				// Get the customer and their Poster client ID
				const customer = await stripe.customers.retrieve(
					paymentIntent.customer as string,
				)

				if (customer.deleted) {
					throw new HTTPException(400, { message: 'Customer was deleted' })
				}

				const posterClientId = Number(customer.metadata.poster_client_id)

				if (!posterClientId || Number.isNaN(posterClientId)) {
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
						level: 'warning',
						message: 'Transaction was already processed',
					})

					return context.json({ received: true })
				}

				try {
					const transactionId = await api.finance.createTransaction(
						context.env.POSTER_TOKEN,
						{
							account_to: 1,
							amount_to: paymentIntent.amount,
							category: 14, // E-wallet top-ups
							comment: `Stripe: ${paymentIntent.id}`,
							date: new Date(event.data.object.created * 1000)
								.toISOString()
								.replace('T', ' ')
								.split('.')
								.at(0) as string,
							id: 1,
							type: 1,
							user_id: posterClientId,
						},
					)

					addBreadcrumb({
						data: {
							amount: paymentIntent.amount,
							posterClientId,
							transactionId,
						},
						level: 'debug',
						message: 'Created Poster finance transaction',
					})

					// eslint-disable-next-line unicorn/prevent-abbreviations
					const eWalletTransactionId = await api.clients.addEWalletPayment(
						context.env.POSTER_TOKEN,
						{
							amount: paymentIntent.amount,
							client_id: posterClientId,
							transaction_id: transactionId,
							type: 2,
						},
					)

					addBreadcrumb({
						data: { eWalletTransactionId, posterClientId, transactionId },
						level: 'debug',
						message: 'Added e-wallet payment',
					})

					await Promise.all([
						context.env.D1_TOLO.prepare(
							'INSERT INTO top_ups (payment_intent_id, client_id, amount, transaction_id, created_at) VALUES (?, ?, ?, ?, ?)',
						)
							.bind(
								paymentIntent.id,
								posterClientId,
								paymentIntent.amount,
								eWalletTransactionId,
								new Date().toISOString(),
							)
							.run(),
						trackServerEvent(context, {
							eventName: 'purchase',
							eventParams: {
								currency: paymentIntent.currency.toUpperCase(),
								transaction_id: paymentIntent.id,
								value: paymentIntent.amount / 100,
							},
							userId: posterClientId.toString(),
						}),
					])

					captureEvent({
						extra: {
							amount: paymentIntent.amount,
							eWalletTransactionId,
							paymentIntentId: paymentIntent.id,
							posterClientId,
							processingTimeMs: Date.now() - event.data.object.created * 1000,
						},
						level: 'debug',
						message: 'Successfully processed payment and updated wallet',
					})

					// Send pass update notification to notify devices that wallet balance changed
					await sendPassUpdateNotification(context, posterClientId)
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

		let parsedData = null as EventData | null
		if (data) {
			try {
				parsedData = (JSON.parse(data) || null) as unknown as EventData
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
			case 'client': {
				switch (action) {
					case 'changed': {
						const client = await api.clients.getClient(
							context.env.POSTER_TOKEN,
							object_id as string,
						)

						if (!client) break

						const stripe = getStripe(context.env.STRIPE_SECRET_KEY)
						const stripeCustomer = await stripe.customers
							.search({
								query: `metadata['poster_client_id']:'${object_id}'`,
							})
							.then((response) => response.data.at(0))

						if (stripeCustomer) {
							await stripe.customers.update(stripeCustomer.id, {
								email: client.email,
								name: client.name,
								phone: client.phone,
							})
						}

						break
					}
				}

				break
			}
			case 'client_payed_sum': {
				const client = await api.clients.getClient(
					context.env.POSTER_TOKEN,
					object_id as string,
				)

				if (!client) {
					captureEvent({
						extra: { client },
						level: 'warning',
						message: 'Client not found',
					})
					break
				}

				await trackServerEvent(context, {
					eventName: 'purchase',
					eventParams: {
						currency: 'MXN',
						transaction_id: object_id as string,
						value:
							parsedData && 'value_absolute' in parsedData
								? (parsedData.value_absolute as number)
								: undefined,
					},
					userData: {
						emailAddress: client.email,
						firstName: client.firstname,
						lastName: client.lastname,
						phoneNumber: client.phone,
					},
					userId: client.client_id,
				})

				break
			}
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

				switch (action) {
					case 'closed': {
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
					case 'changed': {
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
				}

				break
			}
			case 'transaction': {
				if (action === 'changed') {
					const transaction = await api.dash.getTransaction(
						context.env.POSTER_TOKEN,
						object_id as string,
					)

					if (!transaction)
						throw new HTTPException(404, { message: 'Transaction not found' })

					const { client_id } = transaction

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

		if (messages.length > 0) {
			const chunks = expo.chunkPushNotifications(messages)

			const tickets: ExpoPushTicket[] = []
			for (const chunk of chunks) {
				const ticket = await expo.sendPushNotificationsAsync(chunk)
				tickets.push(...ticket)
			}

			getCurrentScope().setExtra('Tickets', tickets)
		}

		getCurrentScope().setExtra('ParsedData', parsedData)

		return context.json({ message: 'Ok' }, 200)
	})

export default webhooks
