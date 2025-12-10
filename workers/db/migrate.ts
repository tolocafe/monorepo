import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/**
 * Run database migrations.
 * This should be run as part of deployment, not at runtime.
 *
 * Usage:
 *   DATABASE_URL=postgres://... bun run workers/db/migrate.ts
 */
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw new Error('DATABASE_URL environment variable is required')
}

// eslint-disable-next-line no-console
console.log('Running migrations...')

const sql = postgres(connectionString, { max: 1 })
const database = drizzle(sql)

// Ensure schema exists first
await sql`CREATE SCHEMA IF NOT EXISTS tolo`

await migrate(database, { migrationsFolder: './workers/db/migrations' })

// eslint-disable-next-line no-console
console.log('Migrations complete!')

await sql.end()
