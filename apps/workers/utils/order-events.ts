/**
 * Shared order event processing utilities
 *
 * This module provides decoupled event detection and processing that can be used
 * by both the polling-based sync and webhook handlers.
 *
 */
import * as Sentry from '@sentry/cloudflare'
import { count, inArray } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { transactions } from '~workers/db/schema'
import type * as schema from '~workers/db/schema'
import type { Bindings } from '~workers/types'
import type { MessageType } from '~workers/utils/messaging'
import { trackEventsBatch } from '~workers/utils/posthog'
import type { BatchEventOptions } from '~workers/utils/posthog'
import { sendPushNotificationToClient } from '~workers/utils/push-notifications'

/**
 * Maximum age for orders to receive notifications (10 minutes in milliseconds)
 * Orders older than this won't trigger push notifications to avoid spam
 */
export const MAX_NOTIFICATION_AGE_MS = 10 * 60 * 1000

/**
 * Represents a change detected in a transaction
 * Used by the polling sync to detect status changes
 */
export type TransactionChange = {
	action: 'created' | 'updated'
	customerId: null | number
	/** Date when order was closed/paid (ISO format) */
	dateClose: null | string
	dateStart: string // Order start date in "Y-m-d H:i:s" format
	/**
	 * Actual income amount in cents (card + cash + third-party).
	 * Excludes eWallet/bonus since those are pre-paid.
	 */
	incomeAmount: number
	/**
	 * Whether order was accepted (from history changeorderstatus with value: 1)
	 * This is the Poster POS "accept order" action, separate from processing_status
	 */
	isAccepted: boolean
	/** Previous dateClose value for detecting payment completion */
	oldDateClose?: null | string
	/** Previous acceptance status */
	oldIsAccepted?: boolean
	oldProcessingStatus?: number
	/** Previous status value */
	oldStatus?: number
	/** Amount paid in cents */
	payedSum: number
	processingStatus: number
	serviceMode: null | number
	/**
	 * Transaction status: 0 = Open, 1 = Closed, 4 = Declined/Cancelled
	 * Note: This is different from processing_status
	 */
	status: number
	transactionId: number
}

/**
 * Represents a detected order event for analytics and communications
 * This is the core event type that can be created from polling OR webhooks
 */
export type OrderEvent = {
	customerId: null | number
	eventType: MessageType
	/**
	 * Actual income amount in cents (card + cash + third-party).
	 * Excludes eWallet/bonus since those are pre-paid.
	 */
	incomeAmount?: number
	/** Order start time for notification filtering */
	orderDate?: Date
	payedSum?: number
	serviceMode: null | number
	transactionId: number
}

/**
 * Status progression order for detecting implied events
 * When we first sync an order that's already at status 20 (accepted),
 * we should emit both order:created and order:accepted since the order
 * went through that progression before our sync caught it.
 */
const STATUS_PROGRESSION: Array<{ messageType: MessageType; status: number }> =
	[
		{ messageType: 'order:created', status: 10 },
		{ messageType: 'order:accepted', status: 20 },
		{ messageType: 'order:ready', status: 30 },
		{ messageType: 'order:delivered', status: 50 },
		{ messageType: 'order:closed', status: 60 }, // Closed
	]

/**
 * Detect order events from a transaction change
 * For newly synced transactions, emits implied events based on current status
 *
 * This is used by the polling sync to detect what events occurred
 * between sync intervals.
 */
export function detectOrderEvents(change: TransactionChange): OrderEvent[] {
	const events: OrderEvent[] = []

	const baseEvent = {
		customerId: change.customerId,
		incomeAmount: change.incomeAmount,
		payedSum: change.payedSum,
		serviceMode: change.serviceMode,
		transactionId: change.transactionId,
	}

	// For newly created (first sync), emit order:created
	if (change.action === 'created') {
		events.push({ ...baseEvent, eventType: 'order:created' })

		// Special case: declined orders (status 4 = Declined/Cancelled)
		if (change.status === 4) {
			events.push({ ...baseEvent, eventType: 'order:declined' })
		}
	}

	// Detect acceptance from history (isAccepted field)
	// Emit for: new orders already accepted, or recently updated orders where acceptance changed
	if (change.isAccepted) {
		if (change.action === 'created') {
			events.push({ ...baseEvent, eventType: 'order:accepted' })
		} else if (!change.oldIsAccepted) {
			// For updates, emit order:accepted
			// The notification age check happens in processOrderEvents
			events.push({ ...baseEvent, eventType: 'order:accepted' })
		}
	}

	// Detect declined orders: status changes to 4 (Declined/Cancelled)
	if (
		change.action === 'updated' &&
		change.oldStatus !== 4 &&
		change.status === 4
	) {
		events.push({ ...baseEvent, eventType: 'order:declined' })
	}

	// For updates, detect processing_status changes for ready/delivered
	if (
		change.action === 'updated' &&
		change.oldProcessingStatus !== undefined &&
		change.oldProcessingStatus !== change.processingStatus
	) {
		// Only emit event for the CURRENT status, not intermediate steps
		// This prevents multiple notifications when status jumps (e.g., 20→50)
		// Status 60 = closed/paid
		const currentStep = STATUS_PROGRESSION.find(
			(step) => step.status === change.processingStatus,
		)
		if (currentStep && currentStep.status >= 30) {
			events.push({ ...baseEvent, eventType: currentStep.messageType })
		}
	}

	return events
}

/**
 * Get human-readable service mode name
 */
export function getServiceModeName(
	serviceMode: null | number,
): 'delivery' | 'dine_in' | 'takeaway' | 'unknown' {
	switch (serviceMode) {
		case 1: {
			return 'dine_in'
		}
		case 2: {
			return 'takeaway'
		}
		case 3: {
			return 'delivery'
		}
		default: {
			return 'unknown'
		}
	}
}

/**
 * Get notification message for order status
 */
export function getOrderStatusNotification(messageType: MessageType) {
	switch (messageType) {
		case 'order:created': {
			// Usually sent when order is first created, handled separately
			return null
		}
		case 'order:accepted': {
			return {
				body: '🧑🏽‍🍳 Ahora estamos trabajando en tu pedido, te avisaremos cuando esté listo',
				title: 'Pedido aceptado',
			}
		}
		case 'order:ready': {
			return {
				body: '✅ Tu pedido ya está listo, te esperamos!',
				title: 'Pedido listo',
			}
		}
		case 'order:delivered': {
			return {
				body: 'Disfruta tu pedido ☕️🥐, esperamos que lo disfrutes!',
				title: 'Pedido entregado',
			}
		}
		case 'order:closed': {
			return {
				body: '☕️ Tu pedido ha sido entregado. ¡Gracias por tu visita!',
				title: 'Pedido completado',
			}
		}
		case 'order:declined': {
			return {
				body: '🚨 Comunícate con nosotros para resolverlo cuanto antes',
				title: 'Pedido no aceptado',
			}
		}
		default: {
			return null
		}
	}
}

/**
 * Process order events - send analytics and notifications
 *
 * This is the main entry point for event processing, used by both
 * polling sync and webhooks.
 *
 * @param events - Array of order events to process
 * @param passDatabase - D1 database for push tokens
 * @param environment - Worker environment bindings
 * @param options - Processing options
 */
export async function processOrderEvents(
	events: OrderEvent[],
	passDatabase: D1Database,
	environment: Bindings,
	options: {
		/** Neon database for querying order counts */
		database?: PostgresJsDatabase<typeof schema>
		/** Skip notification age check (for real-time webhook processing) */
		skipAgeCheck?: boolean
		/** Skip notifications entirely (analytics only) */
		skipNotifications?: boolean
	} = {},
): Promise<{ analyticsCount: number; notificationCount: number }> {
	const now = Date.now()
	const { database, skipAgeCheck = false, skipNotifications = false } = options

	// Query order counts for customers with order:closed events
	const orderCountMap = new Map<number, number>()

	const closedEvents = events.filter(
		(e) => e.eventType === 'order:closed' && e.customerId !== null,
	)
	const customerIds = [
		...new Set(closedEvents.map((e) => e.customerId as number)),
	]

	const results =
		(await database
			?.select({
				count: count(),
				customerId: transactions.customerId,
			})
			.from(transactions)
			.where(inArray(transactions.customerId, customerIds))
			.groupBy(transactions.customerId)) ?? ([] as never[])

	for (const result of results) {
		orderCountMap.set(result.customerId as number, result.count ?? 0)
	}

	// Prepare batch analytics events (filter out events without customers)
	// Revenue properties follow PostHog format: https://posthog.com/docs/new-to-posthog/revenue
	const batchAnalyticsEvents: BatchEventOptions[] = events
		.filter((event) => event.customerId !== null)
		.map((event) => {
			const baseProperties = {
				service_mode: getServiceModeName(event.serviceMode),
				transaction_id: event.transactionId.toString(),
			}

			// For order:closed events, include revenue properties and order count
			if (event.eventType === 'order:closed') {
				const orderCount = orderCountMap.get(event.customerId!)
				return {
					distinctId: event.customerId!.toString(),
					event: event.eventType,
					properties: {
						...baseProperties,
						// Actual income (card + cash + third-party, excludes eWallet)
						...(event.incomeAmount !== undefined
							? {
									amount: Math.floor(event.incomeAmount / 10_000),
									currency: 'MXN',
								}
							: {}),
					},
					// Set user properties with order count
					...(orderCount !== undefined
						? { userProperties: { order_count: orderCount } }
						: {}),
				}
			}

			return {
				distinctId: event.customerId!.toString(),
				event: event.eventType,
				properties: baseProperties,
			}
		})

	// Process push notifications
	const notificationPromises: Promise<void>[] = []

	if (!skipNotifications) {
		for (const event of events) {
			// Skip if no customer
			if (!event.customerId) continue

			// Check age if we have an order date and aren't skipping the check
			if (!skipAgeCheck && event.orderDate) {
				const orderAgeMs = now - event.orderDate.getTime()
				if (orderAgeMs > MAX_NOTIFICATION_AGE_MS) continue
			}

			// Get notification message for this event type
			const notification = getOrderStatusNotification(event.eventType)
			if (!notification) continue

			const { customerId, eventType, transactionId } = event

			notificationPromises.push(
				(async () => {
					try {
						await sendPushNotificationToClient(customerId, passDatabase, {
							...notification,
							data: { orderId: transactionId.toString() },
						})
					} catch (error) {
						Sentry.captureException(error, {
							contexts: {
								transaction: {
									customer_id: customerId,
									message_type: eventType,
									transaction_id: transactionId,
								},
							},
							level: 'warning',
							tags: { operation: 'order_notification' },
						})
					}
				})(),
			)
		}
	}

	// Process all events in parallel
	await Promise.allSettled([
		batchAnalyticsEvents.length > 0
			? trackEventsBatch(environment, batchAnalyticsEvents)
			: Promise.resolve(),
		...notificationPromises,
	])

	return {
		analyticsCount: batchAnalyticsEvents.length,
		notificationCount: notificationPromises.length,
	}
}

/**
 * Map Poster processing status to event type
 */
export function getEventTypeFromStatus(
	processingStatus: number,
): MessageType | null {
	switch (processingStatus) {
		case 10: {
			return 'order:created'
		}
		case 20: {
			return 'order:accepted'
		}
		case 30: {
			return 'order:ready'
		}
		case 50: {
			return 'order:delivered'
		}
		case 70: {
			return 'order:declined'
		}
		default: {
			return null
		}
	}
}
