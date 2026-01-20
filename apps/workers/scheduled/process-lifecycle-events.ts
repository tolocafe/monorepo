import * as Sentry from '@sentry/cloudflare'
import type { DashTransaction } from '@tolo/common/api'
import { and, eq, isNotNull, sql } from 'drizzle-orm'

import { orderLines, transactions } from '@/db/schema'

import type { Database, SyncResult } from './sync/transactions'

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
		payed_sum: number
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
	customer_id: number
	transaction_id: number
	type: LifecycleEventType
}

/**
 * Process customer lifecycle events from sync results
 */
export default async function processCustomerLifecycleEvents(
	syncResult: SyncResult,
	database: Database,
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
			// Skip transactions without a customer (client_id is null or '0')
			if (!transaction.client_id || transaction.client_id === '0') {
				continue
			}

			const clientId = Number(transaction.client_id)
			const transactionId = Number(transaction.transaction_id)

			// Check if this is a new customer or a revival
			const customerHistory = await getCustomerHistory(clientId, database)

			if (customerHistory.total_orders === 1) {
				// First time customer
				events.push({
					customer_id: clientId,
					data: {
						payed_sum: transaction.payed_sum,
						transaction_date: transaction.date_create,
					},
					transaction_id: transactionId,
					type: 'first_time_customer',
				})

				Sentry.addBreadcrumb({
					category: 'lifecycle',
					data: { client_id: clientId },
					level: 'info',
					message: 'First time customer detected',
				})
			} else if (customerHistory.days_since_last_order >= 30) {
				// Revival - customer hasn't ordered in 30+ days
				events.push({
					customer_id: clientId,
					data: {
						days_since_last_order: customerHistory.days_since_last_order,
						last_transaction_date: customerHistory.last_transaction_date || '',
						transaction_date: transaction.date_create,
					},
					transaction_id: transactionId,
					type: 'revival',
				})

				Sentry.addBreadcrumb({
					category: 'lifecycle',
					data: {
						client_id: clientId,
						days_inactive: customerHistory.days_since_last_order,
					},
					level: 'info',
					message: 'Customer revival detected',
				})
			}

			// Check for milestone orders (5th, 10th, 25th, 50th, 100th, etc.)
			if (isMilestone(customerHistory.total_orders)) {
				events.push({
					customer_id: clientId,
					data: {
						order_count: customerHistory.total_orders,
					},
					transaction_id: transactionId,
					type: 'milestone_order',
				})

				Sentry.addBreadcrumb({
					category: 'lifecycle',
					data: {
						client_id: clientId,
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
					clientId,
					transaction.products.map(
						(p: NonNullable<DashTransaction['products']>[number]) =>
							p.product_id,
					),
					database,
				)

				if (discoveredProducts.length > 0) {
					events.push({
						customer_id: clientId,
						data: {
							discovered_product_ids: discoveredProducts,
						},
						transaction_id: transactionId,
						type: 'product_discovery',
					})

					Sentry.addBreadcrumb({
						category: 'lifecycle',
						data: {
							client_id: clientId,
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
			// Skip transactions without a customer (client_id is null or '0')
			if (!transaction.client_id || transaction.client_id === '0') {
				continue
			}

			const clientId = Number(transaction.client_id)
			const transactionId = Number(transaction.transaction_id)

			// Find the previous version to compare
			const previousVersion = await database
				.select({ date_close: transactions.dateClose })
				.from(transactions)
				.where(eq(transactions.id, transactionId))
				.limit(1)
				.then((rows) => rows.at(0))

			if (!previousVersion) continue

			// Check if payment was just completed (date_close was added)
			if (!previousVersion.date_close && transaction.date_close) {
				events.push({
					customer_id: clientId,
					data: {
						date_close: transaction.date_close,
						payed_sum: Number(transaction.payed_sum),
					},
					transaction_id: transactionId,
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
	clientId: number,
	currentProductIds: string[],
	database: Database,
): Promise<string[]> {
	if (currentProductIds.length === 0) return []

	const previousProducts = await database
		.select({ productId: orderLines.productId })
		.from(orderLines)
		.innerJoin(transactions, eq(orderLines.transactionId, transactions.id))
		.where(
			and(
				eq(transactions.customerId, clientId),
				isNotNull(orderLines.productId),
			),
		)
		.groupBy(orderLines.productId)

	const previousProductIds = new Set<string>(
		previousProducts
			.map((row) => row.productId)
			.filter((id): id is number => id !== null && id !== undefined)
			.map((id) => id.toString()),
	)

	// Find products in current order that aren't in previous orders
	return currentProductIds.filter((id) => !previousProductIds.has(id))
}

/**
 * Get customer transaction history
 */
async function getCustomerHistory(
	clientId: number,
	database: Database,
): Promise<{
	days_since_last_order: number
	last_transaction_date: null | string
	total_orders: number
}> {
	const [result] = await database
		.select({
			last_transaction_date: sql<
				null | string
			>`MAX(${transactions.dateCreated})`,
			total_orders: sql<number>`COUNT(*)`,
		})
		.from(transactions)
		.where(eq(transactions.customerId, clientId))

	if (!result.last_transaction_date) {
		return {
			days_since_last_order: 0,
			last_transaction_date: null,
			total_orders: result.total_orders || 0,
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
