import postgres from 'postgres'

type HyperdriveBinding = {
	connectionString: string
}

/**
 * Ensure the tolo schema exists.
 * Tables are managed via drizzle-kit migrations (run `bun db:push` or `bun db:migrate`).
 */
export async function ensureSchema(hyperdrive: HyperdriveBinding) {
	const sql = postgres(hyperdrive.connectionString, {
		fetch_types: false,
		max: 1,
	})

	await sql`CREATE SCHEMA IF NOT EXISTS tolo`
	await sql.end()
}
