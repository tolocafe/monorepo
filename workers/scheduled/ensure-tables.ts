/**
 * Ensure transactions table exists in D1
 */
export default async function ensureTables(database: D1Database) {
	await database
		.prepare(
			`CREATE TABLE IF NOT EXISTS transactions (
				transaction_id TEXT PRIMARY KEY NOT NULL,
				client_id TEXT,
				payed_sum TEXT NOT NULL,
				products TEXT,
				date_created TEXT NOT NULL,
				date_close TEXT,
				table_id INTEGER,
				pay_type INTEGER,
				date_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`,
		)
		.run()

	// Create indexes
	await database
		.prepare(
			`CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id)`,
		)
		.run()

	await database
		.prepare(
			`CREATE INDEX IF NOT EXISTS idx_transactions_date_created ON transactions(date_created)`,
		)
		.run()

	await database
		.prepare(
			`CREATE INDEX IF NOT EXISTS idx_transactions_synced_at ON transactions(synced_at)`,
		)
		.run()
}
