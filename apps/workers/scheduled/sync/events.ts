/**
 * Transaction event processing for the polling sync
 *
 * This module bridges the sync layer with the shared order-events utility,
 * handling sync-specific concerns like Apple Pass updates and date parsing.
 */
import * as Sentry from '@sentry/cloudflare'

import type { Bindings } from '@/types'
import { notifyApplePassUpdate } from '@/utils/apns'
import { notifyGooglePassUpdate } from '@/utils/generate-google-pass'
import { detectOrderEvents, processOrderEvents } from '@/utils/order-events'
import type { TransactionChange } from '@/utils/order-events'

import type { Database } from './transactions'
import { parsePosterDate } from './utils'

// Re-export types for convenience
export type { OrderEvent, TransactionChange } from '@/utils/order-events'

/**
 * Process transaction changes from the sync
 *
 * This is the main entry point for event processing after a sync completes.
 * It handles:
 * - Detecting order events from transaction changes
 * - Processing analytics and notifications via shared utility
 * - Updating wallet passes when stamp counts can change (order closed/reopened)
 */
export async function processTransactionEvents(
	changes: TransactionChange[],
	passDatabase: D1Database,
	environment: Bindings,
	database: Database,
): Promise<void> {
	// Track customers for pass updates when stamps can change
	const customerIdsForPassUpdate = new Set<number>()
	// Collect detected order events for analytics
	const orderEvents: ReturnType<typeof detectOrderEvents> = []

	const shouldUpdatePassForChange = (
		change: TransactionChange,
	): change is TransactionChange & { customerId: number } => {
		if (!change.customerId) return false

		// Only update when the transaction becomes closed or reopens (affects stamp count)
		// We consider status "2" as closed, consistent with stamps calculation.
		if (change.status === 2 && change.action === 'created') return true

		if (change.oldStatus === null || change.oldStatus === undefined) {
			return change.status === 2
		}

		if (change.oldStatus === change.status) return false
		return change.oldStatus === 2 || change.status === 2
	}

	for (const change of changes) {
		if (shouldUpdatePassForChange(change)) {
			customerIdsForPassUpdate.add(change.customerId)
		}

		// Detect order events based on status changes
		const detectedEvents = detectOrderEvents(change)

		// Attach order dates to events for notification filtering
		for (const event of detectedEvents) {
			try {
				event.orderDate = parsePosterDate(change.dateStart)
			} catch {
				// Skip invalid dates
			}
		}

		orderEvents.push(...detectedEvents)
	}

	// Process wallet pass updates for customers whose stamps can change
	const passUpdatePromises: Promise<void>[] = []

	for (const customerId of customerIdsForPassUpdate) {
		passUpdatePromises.push(
			(async () => {
				try {
					await Promise.allSettled([
						notifyApplePassUpdate(customerId, passDatabase, environment),
						notifyGooglePassUpdate(customerId, passDatabase, environment),
					])
				} catch (error) {
					Sentry.captureException(error)
				}
			})(),
		)
	}

	// Process order events (analytics + notifications) using shared utility
	const [eventResult] = await Promise.allSettled([
		processOrderEvents(orderEvents, passDatabase, environment, { database }),
		...passUpdatePromises,
	])

	// Log summary of order events
	if (orderEvents.length > 0 && eventResult.status === 'fulfilled') {
		const { analyticsCount, notificationCount } = eventResult.value
		const eventTypes = [...new Set(orderEvents.map((e) => e.eventType))].join(
			', ',
		)
		// eslint-disable-next-line no-console
		Sentry.captureMessage(
			`[events] ${orderEvents.length} events (${eventTypes}) → ${analyticsCount} analytics, ${notificationCount} notifications`,
			'debug',
		)
	}
}
