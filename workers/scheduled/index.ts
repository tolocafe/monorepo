import * as Sentry from '@sentry/cloudflare'
import ensureTables from 'workers/scheduled/ensure-tables'
import processCustomerLifecycleEvents from 'workers/scheduled/process-lifecycle-events'
import syncTransactions from 'workers/scheduled/sync-transactions'

import type { Bindings } from 'workers/types'

async function syncData(
	_controller: ScheduledController,
	environment: Bindings,
	_context: ExecutionContext,
) {
	// Must be first
	await ensureTables(environment.D1_TOLO)

	const result = await syncTransactions(
		environment.POSTER_TOKEN,
		environment.D1_TOLO,
	)

	if (result) {
		Sentry.addBreadcrumb({
			category: 'sync',
			data: {
				created: result.created.length,
				deleted: result.deleted.length,
				errors: result.errors,
				synced: result.synced,
				updated: result.updated.length,
			},
			level: 'info',
			message: 'Data sync completed',
		})

		// Process customer lifecycle events based on sync results
		const lifecycleEvents = await processCustomerLifecycleEvents(
			result,
			environment.D1_TOLO,
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
	}
}

export default ((controller, environment, context) => {
	Sentry.captureMessage('Starting scheduled data sync')

	context.waitUntil(syncData(controller, environment, context))
}) satisfies ExportedHandlerScheduledHandler<Bindings>
