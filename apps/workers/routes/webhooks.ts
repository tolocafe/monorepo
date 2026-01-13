import {
	addBreadcrumb,
	captureEvent,
	captureException,
} from '@sentry/cloudflare'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

import type { Bindings } from '~workers/types'
import { trackServerEvent } from '~workers/utils/analytics'
import { notifyApplePassUpdate } from '~workers/utils/apns'
import createApplePass from '~workers/utils/generate-apple-pass'
import HttpStatusCode from '~workers/utils/http-codes'
import { posterApi } from '~workers/utils/poster'
import { trackEvent } from '~workers/utils/posthog'
import { getStripe } from '~workers/utils/stripe'

/** Helper function to create required D1 tables */
async function ensurePassTables(database: D1Database) {
	// D1 requires sequential execution of CREATE TABLE statements
	await database
		.prepare(
			`CREATE TABLE IF NOT EXISTS pass_auth_tokens (
				client_id INTEGER PRIMARY KEY,
				auth_token TEXT UNIQUE NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`,
		)
		.run()

	await database
		.prepare(
			`CREATE TABLE IF NOT EXISTS pass_registrations (
				device_library_id TEXT,
				pass_type_identifier TEXT,
				serial_number TEXT,
				client_id INTEGER,
				push_token TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY (device_library_id, serial_number)
			)`,
		)
		.run()

	await database
		.prepare(
			`CREATE TABLE IF NOT EXISTS pass_updates (
				serial_number TEXT PRIMARY KEY,
				pass_type_identifier TEXT,
				client_id INTEGER,
				last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)`,
		)
		.run()
}

// Helper function to extract client ID from pass serial number
function extractClientIdFromPassId(passId: string): null | number {
	const regex = /^TOLO-(\d+)$/
	const match = regex.exec(passId)
	if (!match) return null
	return Number(match[1])
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

		// Send pass update notification using reusable utility
		const result = await notifyApplePassUpdate(
			clientId,
			context.env.D1_TOLO,
			context.env,
		)

		if (result.deviceCount === 0) {
			captureEvent({
				extra: { clientId, serialNumber },
				level: 'debug',
				message: 'No devices registered for pass update',
			})
			return
		}

		captureEvent({
			extra: {
				clientId,
				deviceCount: result.deviceCount,
				failed: result.failed,
				serialNumber,
				successful: result.successful,
			},
			level: result.failed > 0 ? 'warning' : 'info',
			message: `Pass update notifications sent: ${result.successful} successful, ${result.failed} failed`,
		})

		addBreadcrumb({
			data: {
				clientId,
				deviceCount: result.deviceCount,
				serialNumber,
				successfulNotifications: result.successful,
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
	.get('/poster', (context) =>
		context.json({ message: 'Ok' }, HttpStatusCode.OK),
	)
	.post('/passes/v1/log', (context) => {
		captureEvent({
			extra: { log: context.req.text() },
			level: 'debug',
			message: 'Passes log webhook received',
		})

		return context.json({ message: 'Ok' }, HttpStatusCode.OK)
	})
	.delete(
		'/passes/v1/devices/:deviceLibraryId/registrations/:passTypeIdentifier/:passId',
		async (context) => {
			const { deviceLibraryId, passId } = context.req.param()
			const authToken = getApplePassAuthToken(context)

			if (!authToken) {
				return context.json(null, HttpStatusCode.UNAUTHORIZED)
			}

			const clientId = extractClientIdFromPassId(passId)
			if (!clientId) {
				return context.json(null, HttpStatusCode.UNAUTHORIZED)
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
					return context.json(null, HttpStatusCode.UNAUTHORIZED)
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

				return context.json({}, HttpStatusCode.OK)
			} catch (error) {
				captureException(error)
				return context.json({}, HttpStatusCode.INTERNAL_SERVER_ERROR)
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
				return context.json({}, HttpStatusCode.UNAUTHORIZED)
			}

			const clientId = extractClientIdFromPassId(passId)
			if (!clientId) {
				return context.json({}, HttpStatusCode.UNAUTHORIZED)
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
					return context.json({}, HttpStatusCode.UNAUTHORIZED)
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

					return context.json({}, HttpStatusCode.OK)
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

				return context.json({}, HttpStatusCode.CREATED)
			} catch (error) {
				captureException(error)
				return context.json({}, HttpStatusCode.INTERNAL_SERVER_ERROR)
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
						Number(passesUpdatedSince) * 1000,
					).toISOString()
					query += ' AND COALESCE(pu.last_updated, pr.created_at) > ?'
					parameters.push(sinceDate)
				}

				const { results } = await context.env.D1_TOLO.prepare(query)
					.bind(...parameters)
					.all<{ serial_number: string }>()

				if (results.length === 0) {
					// No content
					return new Response(null, { status: HttpStatusCode.NO_CONTENT })
				}

				const serialNumbers = results.map((result) => result.serial_number)
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
				return context.json(null, HttpStatusCode.INTERNAL_SERVER_ERROR)
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
				return context.json(null, HttpStatusCode.UNAUTHORIZED)
			}

			const clientId = extractClientIdFromPassId(serialNumber)
			if (!clientId) {
				return context.json(null, HttpStatusCode.UNAUTHORIZED)
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

				if (authResult?.auth_token !== authToken) {
					return context.json(null, HttpStatusCode.UNAUTHORIZED)
				}

				// Get client data
				const client = await posterApi.clients.getClientById(
					context.env.POSTER_TOKEN,
					clientId,
				)

				if (!client) {
					return context.json(null, HttpStatusCode.NOT_FOUND)
				}

				// Generate updated pass with the SAME auth token from database
				const pass = await createApplePass(
					context,
					authResult.auth_token,
					client,
				)

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

				return new Response(pass.getAsBuffer() as unknown as BodyInit, {
					headers: {
						'Content-Type': 'application/vnd.apple.pkpass',
						'Last-Modified': new Date().toUTCString(),
					},
				})
			} catch (error) {
				captureException(error)
				return context.json(null, HttpStatusCode.INTERNAL_SERVER_ERROR)
			}
		},
	)
	.post('/stripe', async (context) => {
		const signature = context.req.header('stripe-signature')

		if (!signature) {
			throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
				message: 'Missing signature',
			})
		}

		const stripe = getStripe(context.env.STRIPE_SECRET_KEY)

		let event = null
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

			throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
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
					throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
						message: 'Customer was deleted',
					})
				}

				const posterClientId = Number(customer.metadata.poster_client_id)

				if (!posterClientId || Number.isNaN(posterClientId)) {
					throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
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
					const transactionId = await posterApi.finance.createTransaction(
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
					const eWalletTransactionId =
						await posterApi.clients.addEWalletPayment(
							context.env.POSTER_TOKEN,
							{
								amount: paymentIntent.amount,
								client_id: posterClientId,
								spot_id: 1,
								// Transaction_id: transactionId,
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
						// GA4 tracking (keeping for backward compatibility)
						trackServerEvent(context, {
							eventName: 'purchase',
							eventParams: {
								currency: paymentIntent.currency.toUpperCase(),
								transaction_id: paymentIntent.id,
								value: paymentIntent.amount / 100,
							},
							userId: posterClientId.toString(),
						}),
						// PostHog tracking for wallet top-up
						trackEvent(context, {
							distinctId: posterClientId.toString(),
							event: 'wallet:topup_complete',
							properties: {
								amount: paymentIntent.amount / 100,
								currency: paymentIntent.currency.toUpperCase(),
								payment_method: 'card',
								topup_amount: paymentIntent.amount / 100,
								transaction_id: paymentIntent.id,
							},
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
			default: {
				// Unhandled event type
				break
			}
		}

		return context.json({ received: true })
	})
	/**
	 * Poster webhook is disabled. We now use polling via `scheduled/sync-transactions.ts`.
	 * Keeping route for backwards compatibility - returns 410 Gone.
	 */
	.post('/poster', (context) =>
		context.json(
			{ message: 'Webhook disabled. Using polling instead.' },
			HttpStatusCode.GONE,
		),
	)

export default webhooks
