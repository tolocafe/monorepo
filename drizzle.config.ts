import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle configuration for schema push workflow.
 *
 * We use `drizzle-kit push` to directly push schema changes to the database.
 * This is the recommended approach for rapid development and production.
 *
 * Usage:
 *   DATABASE_URL=postgres://... bun run db:push
 *
 * The schema is defined in TypeScript at ./apps/workers/db/schema.ts
 * and is the single source of truth.
 */
export default defineConfig({
	dbCredentials: {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		url: process.env.DATABASE_URL!,
	},
	dialect: 'postgresql',
	schema: './apps/workers/db/schema.ts',
	// No 'out' field - we use 'drizzle-kit push' to push schema directly
	// SQL migration files are not needed for this workflow
})
