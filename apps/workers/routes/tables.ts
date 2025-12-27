import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { z } from 'zod'

import { extractToken, verifyJwt } from '~workers/utils/jwt'
import {
	EntityType,
	api as posterApi,
	ServiceMode,
	TransactionStatus,
} from '~workers/utils/poster'
import { trackEvent } from '~workers/utils/posthog'
import { getStripe } from '~workers/utils/stripe'

import type { Bindings } from '~workers/types'

const PayTableSchema = z.object({
	paymentIntentId: z.string().optional(),
	paymentMethod: z.enum(['ewallet', 'stripe']).default('stripe'),
	phone: z.string().optional(),
})

const tables = new Hono<{ Bindings: Bindings }>()

/**
 * GET /tables/:locationId/:tableId
 * Check if there's an active order at a table
 * Returns the transaction ID if found, 404 otherwise
 * Public endpoint - no authentication required
 */
tables.get('/:locationId/:tableId', async (c) => {
	const tableId = c.req.param('tableId')
	const token = c.env.POSTER_TOKEN

	try {
		// Get open transactions for this specific table
		const transactions = await posterApi.dash.getTransactions(token, {
			status: TransactionStatus.Open,
			table_id: tableId,
			service_mode: ServiceMode.DineIn,
		})

		const currentTransaction = transactions.at(0)

		if (!currentTransaction) {
			return c.json({ transactionId: null })
		}

		return c.json({
			transactionId: currentTransaction.transaction_id,
		})
	} catch (error) {
		captureException(error)

		return c.json({ error: 'Failed to check table status' }, 500)
	}
})

/**
 * POST /tables/:locationId/:tableId/payment-intent
 * Create a Stripe payment intent for a table bill
 * Public endpoint - no authentication required
 */
tables.post('/:locationId/:tableId/payment-intent', async (c) => {
	const locationId = c.req.param('locationId')
	const tableId = c.req.param('tableId')
	const token = c.env.POSTER_TOKEN

	try {
		// Get the transaction for this table
		const transactions = await posterApi.dash.getTransactions(token, {
			include_products: 'true',
			status: TransactionStatus.Open,
			type: EntityType.Spots,
		})

		const tableTransaction = transactions.find(
			(t) => t.spot_id === tableId || t.table_id === tableId,
		)

		if (!tableTransaction) {
			return c.json({ error: 'No active bill found for this table' }, 404)
		}

		const total = Number(tableTransaction.payed_sum)
		const amountInCents = Math.round(total * 100)

		// Create Stripe payment intent
		const stripe = getStripe(c.env.STRIPE_SECRET_KEY)

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amountInCents,
			currency: 'mxn',
			metadata: {
				locationId,
				tableId,
				transactionId: tableTransaction.transaction_id,
			},
		})

		return c.json({
			paymentIntent: {
				client_secret: paymentIntent.client_secret,
			},
		})
	} catch {
		return c.json({ error: 'Failed to create payment intent' }, 500)
	}
})

/**
 * POST /tables/:locationId/:tableId/pay
 * Mark a table's transaction as paid in Poster
 * Supports both Stripe and e-wallet payments
 * Optional authentication - required for e-wallet, optional for Stripe
 * If no auth but phone provided (Stripe only), creates guest client
 */
tables.post('/:locationId/:tableId/pay', async (c) => {
	c.req.param('locationId') // Reserved for future multi-location support
	const tableId = c.req.param('tableId')
	const body = PayTableSchema.parse(await c.req.json())
	const { paymentIntentId, paymentMethod, phone } = body
	const token = c.env.POSTER_TOKEN

	try {
		// Check for optional authentication
		let authenticatedClientId: null | number = null
		const authHeader = c.req.header('Authorization')
		const jwtToken = extractToken(authHeader)

		if (jwtToken) {
			const [clientIdString] = await verifyJwt(jwtToken, c.env.JWT_SECRET)
			if (clientIdString) {
				authenticatedClientId = Number(clientIdString)
			}
		}

		// E-wallet payments require authentication
		if (paymentMethod === 'ewallet' && !authenticatedClientId) {
			return c.json(
				{ error: 'Authentication required for e-wallet payments' },
				401,
			)
		}

		// Stripe payments require a payment intent ID
		if (paymentMethod === 'stripe' && !paymentIntentId) {
			return c.json(
				{ error: 'Payment intent ID required for Stripe payments' },
				400,
			)
		}

		// Get the transaction for this table
		const transactions = await posterApi.dash.getTransactions(token, {
			status: TransactionStatus.Open,
			type: EntityType.Spots,
		})

		const tableTransaction = transactions.find(
			(t) => t.spot_id === tableId || t.table_id === tableId,
		)

		if (!tableTransaction) {
			return c.json({ error: 'No active bill found for this table' }, 404)
		}

		let assignedClientId: null | number = null

		// Priority: authenticated user > existing client > create from phone
		if (authenticatedClientId) {
			// Use authenticated user's client ID
			assignedClientId = authenticatedClientId
		} else if (tableTransaction.client_id !== '0') {
			// Transaction already has a client assigned
			assignedClientId = Number(tableTransaction.client_id)
		} else if (phone) {
			// No auth and no existing client, try to find/create from phone
			const existingClient = await posterApi.clients.getClient(token, phone)

			if (existingClient) {
				assignedClientId = Number(existingClient.client_id)
			} else {
				// Create new guest client
				assignedClientId = await posterApi.clients.createClient(token, {
					client_groups_id_client: 1, // Default guest group
					phone,
				})
			}
		}

		// Close the transaction with the payment
		const transactionId = Number(tableTransaction.transaction_id)
		const amountInPesos = Number(tableTransaction.payed_sum)
		const amountInCents = Math.round(amountInPesos * 100)

		// Handle e-wallet payment
		if (paymentMethod === 'ewallet' && authenticatedClientId) {
			// Deduct from e-wallet
			await posterApi.clients.addEWalletTransaction(token, {
				amount: amountInCents,
				client_id: authenticatedClientId,
			})
		}

		// Close transaction as paid with client assignment if available
		const paymentReference =
			paymentMethod === 'ewallet'
				? `ewallet_${Date.now()}`
				: (paymentIntentId as string)

		await posterApi.transactions.closeTransaction(token, {
			clientId: assignedClientId ?? undefined,
			payed_third_party: amountInPesos,
			paymentIntentId: paymentReference,
			transaction_id: transactionId,
		})

		// Track table payment completion
		const itemCount =
			tableTransaction.products?.reduce(
				(sum, p) => sum + Math.round(Number(p.num)),
				0,
			) ?? 0

		// Use client ID or generate anonymous ID for guest
		const distinctId = assignedClientId
			? assignedClientId.toString()
			: `guest_${tableId}_${transactionId}`

		await trackEvent(c, {
			distinctId,
			event: 'table:payment_complete',
			properties: {
				bill_total: amountInPesos,
				currency: 'MXN',
				is_guest: !authenticatedClientId,
				item_count: itemCount,
				payment_method: paymentMethod,
				table_id: tableId,
				transaction_id: paymentReference,
			},
		})

		return c.json({
			success: true,
			transactionId: tableTransaction.transaction_id,
		})
	} catch {
		return c.json({ error: 'Failed to process payment' }, 500)
	}
})

export default tables
