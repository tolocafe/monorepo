import * as Sentry from '@sentry/cloudflare'

import { getDatabase } from '~workers/db/client'
import processCustomerLifecycleEvents from '~workers/scheduled/process-lifecycle-events'
import syncTransactions from '~workers/scheduled/sync-transactions'

import type { Bindings } from '~workers/types'

async function syncData(
	_controller: ScheduledController,
	environment: Bindings,
	_context: ExecutionContext,
) {
	try {
		const neonDatabase = getDatabase(environment.HYPERDRIVE)

		const result = await syncTransactions(
			environment.POSTER_TOKEN,
			environment.HYPERDRIVE,
			environment.D1_TOLO,
			environment,
		)

		if (result.created.length > 0) {
			Sentry.captureEvent({
				extra: { created: result.created },
				message: 'Created transactions',
			})
		}
		if (result.updated.length > 0) {
			Sentry.captureEvent({
				extra: { updated: result.updated },
				message: 'Updated transactions',
			})
		}

		// Process customer lifecycle events based on sync results
		const lifecycleEvents = await processCustomerLifecycleEvents(
			result,
			neonDatabase,
		)

		for (const event of lifecycleEvents) {
			switch (event.type) {
				// case 'first_time_customer':
				//   await sendWelcomeNotification(event.customer_id, event.data)
				//   break
				// case 'milestone_order':
				//   await celebrateMilestone(event.customer_id, event.data.order_count)
				//   break
				// case 'revival':
				//   await sendRevivalNotification(event.customer_id, event.data.days_since_last_order)
				//   break
				default:
					// eslint-disable-next-line no-console
					console.log(`Should handle ${event.type} event`)
					break
			}
		}

		Sentry.captureCheckIn({
			monitorSlug: 'scheduled-data-sync',
			status: 'ok',
		})
	} catch (error) {
		Sentry.captureException(error)

		Sentry.captureCheckIn({
			monitorSlug: 'scheduled-data-sync',
			status: 'error',
		})
	}
}

export default ((controller, environment, context) => {
	// Sentry.captureEvent({ message: 'Starting scheduled data sync' })
	Sentry.captureCheckIn({
		monitorSlug: 'scheduled-data-sync',
		status: 'in_progress',
	})

	context.waitUntil(syncData(controller, environment, context))
}) satisfies ExportedHandlerScheduledHandler<Bindings>
