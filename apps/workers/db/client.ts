import * as Sentry from '@sentry/cloudflare'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'
import { relations } from './schema'

type HyperdriveBinding = {
	connectionString: string
}

export function getDatabase(hyperdrive: HyperdriveBinding) {
	Sentry.captureMessage('[DB] Creating postgres connection', 'debug')

	const sql = postgres(hyperdrive.connectionString, {
		// Avoid extra round-trips for array types
		fetch_types: false,
		// Limit connections for Workers
		max: 5,
	})

	Sentry.captureMessage('[DB] Postgres connection created, initializing Drizzle', 'debug')

	return drizzle({ client: sql, relations, schema })
}
