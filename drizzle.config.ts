import { defineConfig } from 'drizzle-kit'

// For migrations, use the direct Neon connection string (not Hyperdrive)
// Set DATABASE_URL in your environment or .env file
export default defineConfig({
	dbCredentials: {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		url: process.env.DATABASE_URL!,
	},
	dialect: 'postgresql',
	out: './workers/db/migrations',
	schema: './workers/db/schema.ts',
	schemaFilter: ['tolo'],
})
