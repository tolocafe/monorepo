import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Bindings } from '~workers/types'
import { extractToken, verifyJwt } from '~workers/utils/jwt'
import { api as posterApi } from '~workers/utils/poster'
import { trackEvent } from '~workers/utils/posthog'
import { getStripe } from '~workers/utils/stripe'

const PayTableSchema = z.object({
	paymentIntentId: z.string(),
	phone: z.string().optional(),
})

const tables = new Hono<{ Bindings: Bindings }>()

/**
 * GET /tables/:locationId/:tableId
 * Fetch specific table bill data from Poster by location and table ID
 * Public endpoint - no authentication required
 */
tables.get('/:locationId/:tableId', async (c) => {
	const locationId = c.req.param('locationId')
	const tableId = c.req.param('tableId')
	const token = c.env.POSTER_TOKEN

	try {
		// Get open transactions for this specific table (spot)
		const transactions = await posterApi.dash.getTransactions(token, {
			include_products: 'true',
			status: '1',
			table_id: tableId,
		})

		const currentTransaction = transactions.at(0)

		if (!currentTransaction) {
			return c.json({ error: 'No active bill found for this table' }, 404)
		}

		// Calculate totals (tax is included in sum in Poster)
		// For open transactions: sum = subtotal, payed_sum = total (what's owed)
		const subtotal = Number(currentTransaction.sum)
		const total = Number(currentTransaction.payed_sum) || subtotal

		// Format items - use product_sum (total for item) divided by quantity to get unit price
		const items =
			currentTransaction.products?.map((product) => {
				const quantity = Math.round(Number(product.num))
				const totalSum = Number(product.product_sum)
				const unitPrice = quantity > 0 ? totalSum / quantity : 0

				return {
					name: product.product_name ?? `Product #${product.product_id}`,
					price: Math.round(unitPrice * 100), // Convert unit price to cents
					productId: product.product_id,
					quantity,
				}
			}) ?? []

		return c.json({
			items,
			locationId,
			subtotal: Math.round(subtotal * 100), // Convert to cents
			tableId,
			tableName: currentTransaction.table_name ?? `Table ${tableId}`,
			tax: 0, // Tax is included in total for Poster
			total: Math.round(total * 100), // Convert to cents
			transactionId: currentTransaction.transaction_id,
		})
	} catch (error) {
		captureException(error)

		return c.json({ error: 'Failed to fetch table bill' }, 500)
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
			status: '1', // 1 = open transactions
			type: 'spots',
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
 * Optional authentication - if auth provided, assigns customer to order
 * If no auth but phone provided, creates guest client
 */
tables.post('/:locationId/:tableId/pay', async (context) => {
	// const _locationId =
	context.req.param('locationId') // Reserved for future multi-location support
	const tableId = context.req.param('tableId')
	const body = PayTableSchema.parse(await context.req.json())
	const { paymentIntentId, phone } = body
	const token = context.env.POSTER_TOKEN

	try {
		// Check for optional authentication
		let authenticatedClientId: null | number = null
		const authHeader = context.req.header('Authorization')
		const jwtToken = extractToken(authHeader)

		if (jwtToken) {
			const [clientIdString] = await verifyJwt(jwtToken, context.env.JWT_SECRET)
			if (clientIdString) {
				authenticatedClientId = Number(clientIdString)
			}
		}

		// Get the transaction for this table
		const transactions = await posterApi.dash.getTransactions(token, {
			status: '1', // 1 = open transactions
			type: 'spots',
		})

		const tableTransaction = transactions.find(
			(t) => t.spot_id === tableId || t.table_id === tableId,
		)

		if (!tableTransaction) {
			return context.json({ error: 'No active bill found for this table' }, 404)
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

		// Close transaction as paid with client assignment if available
		await posterApi.transactions.closeTransaction(token, {
			clientId: assignedClientId ?? undefined,
			payed_third_party: amountInPesos,
			paymentIntentId,
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

		await trackEvent(context, {
			distinctId,
			event: 'table:payment_complete',
			properties: {
				bill_total: amountInPesos,
				currency: 'MXN',
				is_guest: !authenticatedClientId,
				item_count: itemCount,
				payment_method: 'card',
				table_id: tableId,
				transaction_id: paymentIntentId,
			},
		})

		return context.json({
			success: true,
			transactionId: tableTransaction.transaction_id,
		})
	} catch {
		return context.json({ error: 'Failed to process payment' }, 500)
	}
})

export default tables
