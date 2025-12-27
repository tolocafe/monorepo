import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { CreateOrderSchema, UpdateQueueItemStateSchema } from '~common/schemas'
import { getProductTotalCost } from '~common/utils'
import { TEAM_GROUP_IDS } from '~workers/utils/constants'
import { authenticate } from '~workers/utils/jwt'
import { api } from '~workers/utils/poster'
import { trackEvent } from '~workers/utils/posthog'

import type { Product, QueueItemState } from '~common/api'
import type { Bindings } from '~workers/types'

/** KV key prefix for queue item states */
const QUEUE_STATE_PREFIX = 'queue:state:'

/** TTL for queue states (24 hours - orders should be completed by then) */
const QUEUE_STATE_TTL = 60 * 60 * 24

/** Generate KV key for a queue item state */
function getQueueStateKey(transactionId: number, lineIndex: number): string {
	return `${QUEUE_STATE_PREFIX}${transactionId}:${lineIndex}`
}

// Modifiers to ignore (not displayed in barista queue)
const IGNORED_MODIFIERS = new Set([
	'Desechable',
	'Para llevar',
	'Sin Desechable',
])

/**
 * Build a map of modifier name → group name from product modifications
 */
function buildModifierGroupMap(products: Product[]): Map<string, string> {
	const map = new Map<string, string>()

	for (const product of products) {
		// Check group_modifications
		for (const group of product.group_modifications ?? []) {
			for (const module_ of group.modifications ?? []) {
				const moduleName = module_.modificator_name || module_.name
				if (moduleName && !map.has(moduleName)) {
					map.set(moduleName, group.name)
				}
			}
		}

		// Check direct modifications (usually single-option modifiers)
		for (const module_ of product.modifications ?? []) {
			const moduleName = module_.modificator_name || module_.name
			if (moduleName && !map.has(moduleName)) {
				// Direct modifications don't have a group, use a generic category
				map.set(moduleName, 'Option')
			}
		}
	}

	return map
}

/**
 * Parse comma-separated modifier string into array of modifier objects
 */
function parseModifiers(
	modifierString: null | string | undefined,
	modifierGroupMap: Map<string, string>,
): { group: string; name: string }[] {
	if (!modifierString) return []

	return modifierString
		.split(',')
		.map((m) => m.trim())
		.filter((m) => m && !IGNORED_MODIFIERS.has(m))
		.map((name) => ({
			group: modifierGroupMap.get(name) || 'Other',
			name,
		}))
}

const orders = new Hono<{ Bindings: Bindings }>()
	.get('/', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const orders = await api.dash.getTransactions(c.env.POSTER_TOKEN, {
			id: clientId.toString(),
			type: 'clients',
		})

		return c.json(orders)
	})
	.get('/barista/queue/states', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		// Verify user is a barista
		const client = await api.clients.getClientById(c.env.POSTER_TOKEN, clientId)

		if (
			!client?.client_groups_id ||
			!TEAM_GROUP_IDS.has(client.client_groups_id)
		) {
			throw new HTTPException(403, { message: 'Access denied' })
		}

		// List all keys with the queue state prefix and fetch their values
		const listResult = await c.env.KV_CMS.list({ prefix: QUEUE_STATE_PREFIX })
		const states: QueueItemState[] = []

		for (const key of listResult.keys) {
			const value = await c.env.KV_CMS.get<QueueItemState>(key.name, 'json')
			if (value) {
				states.push(value)
			}
		}

		return c.json(states)
	})
	.put('/barista/queue/state', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		// Verify user is a barista
		const client = await api.clients.getClientById(c.env.POSTER_TOKEN, clientId)

		if (
			!client?.client_groups_id ||
			!TEAM_GROUP_IDS.has(client.client_groups_id)
		) {
			throw new HTTPException(403, { message: 'Access denied' })
		}

		const body = await c.req.json()
		const parsed = UpdateQueueItemStateSchema.safeParse(body)

		if (!parsed.success) {
			throw new HTTPException(400, { message: 'Invalid request body' })
		}

		const { transactionId, lineIndex, status } = parsed.data
		const updatedBy =
			`${client.firstname ?? ''} ${client.lastname ?? ''}`.trim() || 'Unknown'

		const key = getQueueStateKey(transactionId, lineIndex)
		const state: QueueItemState = {
			lineIndex,
			status,
			transactionId,
			updatedAt: new Date().toISOString(),
			updatedBy,
			updatedByClientId: clientId,
		}

		// Store in KV with TTL
		await c.env.KV_CMS.put(key, JSON.stringify(state), {
			expirationTtl: QUEUE_STATE_TTL,
		})

		return c.json({
			...state,
			success: true,
		})
	})
	.get('/barista/queue', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		// Verify user is a barista
		const client = await api.clients.getClientById(c.env.POSTER_TOKEN, clientId)

		if (
			!client?.client_groups_id ||
			!TEAM_GROUP_IDS.has(client.client_groups_id)
		) {
			throw new HTTPException(403, { message: 'Access denied' })
		}

		// Fetch products and orders in parallel
		const [orders, allProducts] = await Promise.all([
			api.dash.getTransactions(c.env.POSTER_TOKEN, {
				include_products: 'true',
				status: '0',
			}),
			api.menu.getMenuProducts(c.env.POSTER_TOKEN),
		])

		// Build modifier → group map from all products
		const modifierGroupMap = buildModifierGroupMap(allProducts)

		// Filter to only show orders that need preparation (Open, Preparing, Ready)
		const activeOrders = orders.filter((order) => {
			const status = Number(order.processing_status)
			return status === 10 || status === 20 || status === 30
		})

		// Augment each order with detailed product info (including modifications array)
		const augmentedOrders = await Promise.all(
			activeOrders.map(async (order) => {
				try {
					const detailedProducts = await api.dash.getTransactionProducts(
						c.env.POSTER_TOKEN,
						order.transaction_id,
					)

					// Only use detailed products if we got results
					if (detailedProducts.length > 0) {
						return {
							...order,
							products: detailedProducts.map((p) => ({
								category_id: p.category_id,
								// Parse modifiers into array with group names
								modifiers: parseModifiers(p.modificator_name, modifierGroupMap),
								num: p.num,
								product_id: p.product_id,
								product_name: p.product_name,
							})),
						}
					}

					// Otherwise keep original products
					return order
				} catch {
					// If fetching detailed products fails, return original order
					return order
				}
			}),
		)

		// Sort by date (oldest first - FIFO for barista queue)
		augmentedOrders.sort((a, b) => {
			const dateA = new Date(a.date_start).getTime()
			const dateB = new Date(b.date_start).getTime()
			return dateA - dateB
		})

		return c.json(augmentedOrders)
	})
	.get('/:id', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)
		const orderId = c.req.param('id')

		try {
			const order = await api.dash.getTransaction(c.env.POSTER_TOKEN, orderId, {
				include_products: 'true',
			})

			if (!order) {
				throw new HTTPException(404, { message: 'Order not found' })
			}

			// Verify the order belongs to the authenticated client
			if (order.client_id !== clientId.toString()) {
				throw new HTTPException(403, { message: 'Access denied' })
			}

			return c.json(order)
		} catch (error) {
			if (error instanceof HTTPException) {
				throw error
			}

			captureException(error)
			throw new HTTPException(500, {
				message: 'Failed to fetch order details',
			})
		}
	})
	.post('/', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const body = (await context.req.json()) as unknown

		if (typeof body !== 'object' || body == null) {
			throw new HTTPException(400, { message: 'Invalid body' })
		}

		try {
			const parsedBody = CreateOrderSchema.parse({
				...body,
				client_id: clientId,
			})
			const paymentAmount = parsedBody.payment.amount

			/*
			 * Verify e-wallet transaction, if customer does not have enough balance,
			 * the transaction will fail and the order will not be created
			 */
			const [transactionId, ...products] = await Promise.all([
				api.clients.addEWalletTransaction(context.env.POSTER_TOKEN, {
					amount: paymentAmount,
					client_id: clientId,
				}),
				...parsedBody.products.map((product) =>
					api.menu.getProduct(context.env.POSTER_TOKEN, product.product_id),
				),
			])

			const order = await api.incomingOrders.createIncomingOrder(
				context.env.POSTER_TOKEN,
				{
					...parsedBody,
					payment: { sum: paymentAmount.toString(), type: 1 },
					products: parsedBody.products.map((product) => {
						const productData = products.find(
							(p) => p.product_id === product.product_id,
						) as Product

						return {
							...product,
							price: getProductTotalCost({
								modifications:
									product.modification?.reduce(
										(accumulator, current) => {
											accumulator[current.m] = current.a
											return accumulator
										},
										{} as Record<string, number>,
									) ?? {},
								product: productData,
							}),
						}
					}),
				},
				clientId,
			)

			await context.env.D1_TOLO.exec(
				'CREATE TABLE IF NOT EXISTS wallet_orders (transaction_id INTEGER, order_id INTEGER, client_id INTEGER, amount INTEGER)',
			)

			await Promise.all([
				context.env.D1_TOLO.prepare(
					'INSERT INTO wallet_orders (transaction_id, order_id, client_id, amount) VALUES (?, ?, ?, ?)',
				)
					.bind(transactionId, order.incoming_order_id, clientId, paymentAmount)
					.run(),
				// Track order completion with PostHog
				trackEvent(context, {
					distinctId: clientId.toString(),
					event: 'order:purchase_complete',
					properties: {
						amount: paymentAmount,
						currency: 'MXN',
						item_count: parsedBody.products.reduce(
							(sum, p) => sum + (p.count || 1),
							0,
						),
						order_id: order.incoming_order_id,
						products: parsedBody.products.map((product) => ({
							price: getProductTotalCost({
								modifications:
									product.modification?.reduce(
										(accumulator, current) => {
											accumulator[current.m] = current.a
											return accumulator
										},
										{} as Record<string, number>,
									) ?? {},
								product: products.find(
									(p) => p.product_id === product.product_id,
								) as Product,
							}),
							product_id: product.product_id,
							quantity: product.count || 1,
						})),
					},
				}),
			])

			return context.json(order)
		} catch (error) {
			captureException(error)

			throw new HTTPException(500, {
				message:
					error instanceof Error ? error.message : 'Failed to create order',
			})
		}
	})

export default orders
