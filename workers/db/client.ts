import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

type HyperdriveBinding = {
	connectionString: string
}

export function getDatabase(hyperdrive: HyperdriveBinding) {
	// eslint-disable-next-line no-console
	console.log('[DB] Creating postgres connection...')

	const sql = postgres(hyperdrive.connectionString, {
		// Avoid extra round-trips for array types
		fetch_types: false,
		// Limit connections for Workers
		max: 5,
	})

	// eslint-disable-next-line no-console
	console.log('[DB] Postgres connection created, initializing Drizzle...')

	return drizzle(sql, { schema })
}
