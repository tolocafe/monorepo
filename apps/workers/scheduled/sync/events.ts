import * as Sentry from '@sentry/cloudflare'

import { notifyApplePassUpdate } from '~workers/utils/apns'
import { sendPushNotificationToClient } from '~workers/utils/push-notifications'

import { parsePosterDate } from './utils'

import type { Bindings } from '../../types'

/**
 * Maximum age for orders to receive notifications (10 minutes in milliseconds)
 */
const MAX_NOTIFICATION_AGE_MS = 10 * 60 * 1000

export type TransactionChange = {
	action: 'created' | 'updated'
	customerId: null | number
	dateStart: string // Order start date in "Y-m-d H:i:s" format
	oldProcessingStatus?: number
	processingStatus: number
	serviceMode: null | number
	transactionId: number
}

/**
 * Process transaction changes and send appropriate notifications
 * This is called after sync completes to handle all event-driven actions
 */
export async function processTransactionEvents(
	changes: TransactionChange[],
	passDatabase: D1Database,
	environment: Bindings,
): Promise<void> {
	// Track new customers for pass updates
	const customerIdsForPassUpdate = new Set<number>()

	for (const change of changes) {
		if (change.customerId && change.action === 'created') {
			customerIdsForPassUpdate.add(change.customerId)
		}
	}

	// Process notifications for takeaway orders
	const notificationPromises: Promise<void>[] = []
	const now = Date.now()

	for (const change of changes) {
		// Only process takeaway orders (service_mode === 2)
		if (change.serviceMode !== 2 || !change.customerId) continue

		// Skip notifications for orders that started more than 10 minutes ago
		// This prevents notifications for stale orders detected during sync
		try {
			const orderDate = parsePosterDate(change.dateStart)
			const orderAgeMs = now - orderDate.getTime()

			if (orderAgeMs > MAX_NOTIFICATION_AGE_MS) {
				continue
			}
		} catch (error) {
			// Log invalid date format and skip this order
			Sentry.captureException(error, {
				contexts: {
					transaction: {
						date_start: change.dateStart,
						transaction_id: change.transactionId,
					},
				},
				level: 'warning',
				tags: { operation: 'date_parsing' },
			})
			continue
		}

		const isStatusChange =
			change.action === 'updated' &&
			change.oldProcessingStatus !== undefined &&
			change.oldProcessingStatus !== change.processingStatus

		const isNewOrderPreparing =
			change.action === 'created' && change.processingStatus === 20

		if (isStatusChange || isNewOrderPreparing) {
			const notification = getOrderStatusNotification(change.processingStatus)

			if (notification && change.customerId) {
				const customerId = change.customerId
				notificationPromises.push(
					(async () => {
						try {
							await sendPushNotificationToClient(customerId, passDatabase, {
								...notification,
								data: { orderId: change.transactionId.toString() },
							})
						} catch (error) {
							// Log but don't fail event processing
							Sentry.captureException(error, {
								contexts: {
									transaction: {
										customer_id: customerId,
										processing_status: change.processingStatus,
										transaction_id: change.transactionId,
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
	}

	// Process Apple Pass updates for new customers
	const passUpdatePromises: Promise<void>[] = []

	for (const customerId of customerIdsForPassUpdate) {
		passUpdatePromises.push(
			(async () => {
				try {
					await notifyApplePassUpdate(customerId, passDatabase, environment)
				} catch (error) {
					Sentry.captureException(error)
				}
			})(),
		)
	}

	// Process all events in parallel
	await Promise.allSettled([...notificationPromises, ...passUpdatePromises])
}

/**
 * Get notification message for order status
 */
function getOrderStatusNotification(
	processingStatus: number,
): null | { body: string; title: string } {
	switch (processingStatus) {
		case 10: // Open
			// Usually sent when order is first created, handled separately
			return null
		case 20: // Preparing
			return {
				body: '🧑🏽‍🍳 Ahora estamos trabajando en tu pedido, te avisaremos cuando esté listo',
				title: 'Pedido aceptado',
			}
		case 30: // Ready
			return {
				body: '✅ Tu pedido ya está listo, te esperamos!',
				title: 'Pedido listo',
			}
		case 40: // En route
			// TODO: Add ETA notification
			return null
		case 50: // Delivered
			return {
				body: 'Disfruta tu pedido ☕️🥐, esperamos que lo disfrutes!',
				title: 'Pedido entregado',
			}
		case 60: // Closed
			// Order completed, no notification needed
			return null
		case 70: // Deleted
			// Order cancelled
			return {
				body: '🚨 Comunícate con nosotros para resolverlo cuanto antes',
				title: 'Pedido no aceptado',
			}
		default:
			return null
	}
}
