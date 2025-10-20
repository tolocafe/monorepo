import * as Sentry from '@sentry/cloudflare'

import type { SyncResult } from './sync-transactions'

export type CustomerLifecycleEvent =
	| FirstTimeCustomerEvent
	| MilestoneOrderEvent
	| PaymentCompletionEvent
	| ProductDiscoveryEvent
	| RevivalEvent
	| WaiterChangeEvent

export type FirstTimeCustomerEvent = BaseLifecycleEvent & {
	data: {
		payed_sum: string
		transaction_date: string
	}
	type: 'first_time_customer'
}

export type LifecycleEventType =
	| 'first_time_customer'
	| 'milestone_order'
	| 'payment_completion'
	| 'product_discovery'
	| 'revival'
	| 'waiter_change'

export type MilestoneOrderEvent = BaseLifecycleEvent & {
	data: {
		order_count: number
	}
	type: 'milestone_order'
}

export type PaymentCompletionEvent = BaseLifecycleEvent & {
	data: {
		date_close: string
		payed_sum: string
	}
	type: 'payment_completion'
}

export type ProductDiscoveryEvent = BaseLifecycleEvent & {
	data: {
		discovered_product_ids: string[]
	}
	type: 'product_discovery'
}

export type RevivalEvent = BaseLifecycleEvent & {
	data: {
		days_since_last_order: number
		last_transaction_date: string
		transaction_date: string
	}
	type: 'revival'
}

export type WaiterChangeEvent = BaseLifecycleEvent & {
	data: {
		current_waiter_id: number
		previous_waiter_id: null | number
	}
	type: 'waiter_change'
}

type BaseLifecycleEvent = {
	customer_id: string
	transaction_id: string
	type: LifecycleEventType
}

/**
 * Process customer lifecycle events from sync results
 */
export default async function processCustomerLifecycleEvents(
	syncResult: SyncResult,
	database: D1Database,
): Promise<CustomerLifecycleEvent[]> {
	const events: CustomerLifecycleEvent[] = []

	try {
		Sentry.addBreadcrumb({
			category: 'lifecycle',
			data: {
				created: syncResult.created.length,
				updated: syncResult.updated.length,
			},
			level: 'info',
			message: 'Processing customer lifecycle events',
		})

		// Process newly created transactions
		for (const transaction of syncResult.created) {
			// Skip transactions without a customer (client_id is null)
			if (!transaction.client_id) {
				continue
			}

			// Check if this is a new customer or a revival
			const customerHistory = await getCustomerHistory(
				transaction.client_id,
				database,
			)

			if (customerHistory.total_orders === 1) {
				// First time customer
				events.push({
					customer_id: transaction.client_id,
					data: {
						payed_sum: transaction.payed_sum,
						transaction_date: transaction.date_created,
					},
					transaction_id: transaction.transaction_id,
					type: 'first_time_customer',
				})

				Sentry.addBreadcrumb({
					category: 'lifecycle',
					data: { client_id: transaction.client_id },
					level: 'info',
					message: 'First time customer detected',
				})
			} else if (customerHistory.days_since_last_order >= 30) {
				// Revival - customer hasn't ordered in 30+ days
				events.push({
					customer_id: transaction.client_id,
					data: {
						days_since_last_order: customerHistory.days_since_last_order,
						last_transaction_date: customerHistory.last_transaction_date || '',
						transaction_date: transaction.date_created,
					},
					transaction_id: transaction.transaction_id,
					type: 'revival',
				})

				Sentry.addBreadcrumb({
					category: 'lifecycle',
					data: {
						client_id: transaction.client_id,
						days_inactive: customerHistory.days_since_last_order,
					},
					level: 'info',
					message: 'Customer revival detected',
				})
			}

			// Check for milestone orders (5th, 10th, 25th, 50th, 100th, etc.)
			if (isMilestone(customerHistory.total_orders)) {
				events.push({
					customer_id: transaction.client_id,
					data: {
						order_count: customerHistory.total_orders,
					},
					transaction_id: transaction.transaction_id,
					type: 'milestone_order',
				})

				Sentry.addBreadcrumb({
					category: 'lifecycle',
					data: {
						client_id: transaction.client_id,
						order_count: customerHistory.total_orders,
					},
					level: 'info',
					message: 'Milestone order detected',
				})
			}

			// Check for product discoveries by existing customer
			if (
				customerHistory.total_orders > 1 &&
				transaction.products &&
				transaction.products.length > 0
			) {
				const discoveredProducts = await findDiscoveredProducts(
					transaction.client_id,
					transaction.products.map((p) => p.product_id),
					database,
				)

				if (discoveredProducts.length > 0) {
					events.push({
						customer_id: transaction.client_id,
						data: {
							discovered_product_ids: discoveredProducts,
						},
						transaction_id: transaction.transaction_id,
						type: 'product_discovery',
					})

					Sentry.addBreadcrumb({
						category: 'lifecycle',
						data: {
							client_id: transaction.client_id,
							discovered_products_count: discoveredProducts.length,
						},
						level: 'info',
						message: 'Product discovery detected',
					})
				}
			}
		}

		// Process updated transactions
		for (const transaction of syncResult.updated) {
			// Skip transactions without a customer (client_id is null)
			if (!transaction.client_id) {
				continue
			}

			// Find the previous version to compare
			const previousVersion = await database
				.prepare(
					`SELECT date_close FROM transactions WHERE transaction_id = ?1`,
				)
				.bind(transaction.transaction_id)
				.first<{ date_close: string }>()

			if (!previousVersion) continue

			// Check if payment was just completed (date_close was added)
			if (!previousVersion.date_close && transaction.date_close) {
				events.push({
					customer_id: transaction.client_id,
					data: {
						date_close: transaction.date_close,
						payed_sum: transaction.payed_sum,
					},
					transaction_id: transaction.transaction_id,
					type: 'payment_completion',
				})

				Sentry.addBreadcrumb({
					category: 'lifecycle',
					data: {
						client_id: transaction.client_id,
						transaction_id: transaction.transaction_id,
					},
					level: 'info',
					message: 'Payment completion detected',
				})
			}

			// TODO: Implement waiter change detection
			// Currently table_id is not the correct identifier for waiters.
			// Need to get the proper waiter/server identifier from the transaction data
			// to track when a customer is assigned to a different waiter.
			//
			// Example implementation once we have the correct field:
			// if (previousVersion.waiter_id !== transaction.waiter_id && transaction.waiter_id) {
			//   events.push({
			//     customer_id: transaction.client_id,
			//     data: {
			//       current_waiter_id: transaction.waiter_id,
			//       previous_waiter_id: previousVersion.waiter_id || null,
			//     },
			//     transaction_id: transaction.transaction_id,
			//     type: 'waiter_change',
			//   })
			// }
		}

		// Count events by type
		const eventCounts = events.reduce(
			(accumulator, event) => {
				accumulator[event.type] = (accumulator[event.type] || 0) + 1
				return accumulator
			},
			{} as Record<LifecycleEventType, number>,
		)

		Sentry.setContext('Lifecycle Events', {
			first_time_customer: eventCounts.first_time_customer || 0,
			milestone_order: eventCounts.milestone_order || 0,
			payment_completion: eventCounts.payment_completion || 0,
			product_discovery: eventCounts.product_discovery || 0,
			revival: eventCounts.revival || 0,
			total: events.length,
			waiter_change: eventCounts.waiter_change || 0,
		})

		// eslint-disable-next-line no-console
		console.log(
			`Lifecycle events processed: ${eventCounts.first_time_customer || 0} first-time customers, ${eventCounts.revival || 0} revivals, ${eventCounts.milestone_order || 0} milestones, ${eventCounts.product_discovery || 0} product discoveries, ${eventCounts.waiter_change || 0} waiter changes, ${eventCounts.payment_completion || 0} payments completed (${events.length} total)`,
		)

		return events
	} catch (error) {
		Sentry.captureException(error, {
			level: 'error',
			tags: {
				operation: 'lifecycle_processing',
			},
		})

		// eslint-disable-next-line no-console
		console.error('Error processing lifecycle events:', error)

		// Return empty events on error
		return events
	}
}

/**
 * Find products that customer hasn't purchased before
 */
async function findDiscoveredProducts(
	clientId: string,
	currentProductIds: string[],
	database: D1Database,
): Promise<string[]> {
	if (currentProductIds.length === 0) return []

	// Get all products this customer has purchased before (excluding current transaction)
	const previousProducts = await database
		.prepare(
			`
			SELECT DISTINCT products
			FROM transactions
			WHERE client_id = ?1
		`,
		)
		.bind(clientId)
		.all<{ products: string }>()

	// Flatten all previous product IDs
	const previousProductIds = new Set<string>()
	for (const row of previousProducts.results) {
		try {
			const products = JSON.parse(row.products) as unknown
			if (Array.isArray(products)) {
				for (const product of products) {
					if (
						typeof product === 'object' &&
						product !== null &&
						'product_id' in product
					) {
						const productId = (product as { product_id: unknown }).product_id
						if (typeof productId === 'string') {
							previousProductIds.add(productId)
						}
					}
				}
			}
		} catch {
			// Skip invalid JSON
		}
	}

	// Find products in current order that aren't in previous orders
	return currentProductIds.filter((id) => !previousProductIds.has(id))
}

/**
 * Get customer transaction history
 */
async function getCustomerHistory(
	clientId: string,
	database: D1Database,
): Promise<{
	days_since_last_order: number
	last_transaction_date: null | string
	total_orders: number
}> {
	const result = await database
		.prepare(
			`
			SELECT
				COUNT(*) as total_orders,
				MAX(date_created) as last_transaction_date
			FROM transactions
			WHERE client_id = ?1
		`,
		)
		.bind(clientId)
		.first<{
			last_transaction_date: null | string
			total_orders: number
		}>()

	if (!result?.last_transaction_date) {
		return {
			days_since_last_order: 0,
			last_transaction_date: null,
			total_orders: result?.total_orders || 0,
		}
	}

	const lastOrderDate = new Date(result.last_transaction_date)
	const daysSince = Math.floor(
		(Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24),
	)

	return {
		days_since_last_order: daysSince,
		last_transaction_date: result.last_transaction_date,
		total_orders: result.total_orders,
	}
}

/**
 * Check if order count is a milestone worth celebrating
 */
function isMilestone(orderCount: number): boolean {
	// Milestones: 5, 10, 25, 50, 100, 250, 500, 1000, etc.
	const milestones = [5, 10, 25, 50, 100, 250, 500, 1000]
	return milestones.includes(orderCount)
}
