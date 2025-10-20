import * as Sentry from '@sentry/cloudflare'
import ensureTables from 'workers/scheduled/ensure-tables'
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
	}
}

export default ((controller, environment, context) => {
	Sentry.captureMessage('Starting scheduled data sync')

	context.waitUntil(syncData(controller, environment, context))
}) satisfies ExportedHandlerScheduledHandler<Bindings>
