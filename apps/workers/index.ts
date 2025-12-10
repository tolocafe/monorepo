import * as Sentry from '@sentry/cloudflare'
import { captureEvent } from '@sentry/cloudflare'
import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

import { getDatabase } from './db/client'
import { ensureSchema } from './db/ensure-schema'
import { syncState, transactions as transactionsTable } from './db/schema'
import auth from './routes/auth'
import broadcast from './routes/broadcast'
import clients from './routes/clients'
import coffees from './routes/coffees'
import events from './routes/events'
import menu from './routes/menu'
import orders from './routes/orders'
import passes from './routes/passes'
import pos from './routes/pos'
import receipts from './routes/receipts'
import tables from './routes/tables'
import transactionsRouter from './routes/transactions'
import webhooks from './routes/webhooks'
import scheduledHandler from './scheduled'
import syncTransactions from './scheduled/sync-transactions'
import { defaultJsonHeaders } from './utils/headers'
import { authenticate } from './utils/jwt'

import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

const TOLO_DOMAIN = 'tolo.cafe'

app
	.use(
		'*',
		cors({
			credentials: true,
			origin: (origin) => {
				try {
					const url = new URL(origin)
					const isAllowed =
						url.hostname === 'localhost' ||
						url.hostname === TOLO_DOMAIN ||
						url.hostname.endsWith(`.${TOLO_DOMAIN}`)
					return isAllowed ? origin : null
				} catch {
					return null
				}
			},
		}),
	)
	.use(async (context, next) => {
		try {
			const [clientId, payload] = await authenticate(
				context,
				context.env.JWT_SECRET,
			)

			if (clientId) {
				Sentry.setUser({
					email: 'email' in payload ? (payload.email as string) : undefined,
					id: clientId.toString(),
					name: 'name' in payload ? (payload.name as string) : undefined,
					phone: 'phone' in payload ? (payload.phone as string) : undefined,
				})
			}
		} catch {
			//
		}
		return next()
	})

app
	.get('/', (context) =>
		context.json(
			{ message: 'Hello Cloudflare Workers!' },
			200,
			defaultJsonHeaders,
		),
	)
	.route('/menu', menu)
	.route('/auth', auth)
	.route('/clients', clients)
	.route('/transactions', transactionsRouter)
	.route('/orders', orders)
	.route('/receipts', receipts)
	.route('/webhooks', webhooks)
	.route('/coffees', coffees)
	.route('/events', events)
	.route('/pos', pos)
	.route('/passes', passes)
	.route('/broadcast', broadcast)
	.route('/tables', tables)
	.get('/debug/run-sync', async (context) => {
		try {
			const hyperdrive = context.env.HYPERDRIVE as { connectionString: string }
			await ensureSchema(hyperdrive)

			// Reset cursor if ?reset=1 to do a full re-sync
			const reset = context.req.query('reset')
			if (reset === '1') {
				const database = getDatabase(hyperdrive)
				await database.execute(
					sql`DELETE FROM tolo.sync_state WHERE id = 'transactions'`,
				)
			}

			const result = await syncTransactions(
				context.env.POSTER_TOKEN,
				hyperdrive,
				context.env.D1_TOLO,
				context.env,
			)

			return context.json(
				{
					created: result.created.length,
					errors: result.errors,
					errorSamples: result.errorSamples,
					fetched: result.fetchedCount,
					startCursor: result.startCursor,
					synced: result.synced,
					toProcess: result.toProcessCount,
					updated: result.updated.length,
				},
				200,
				defaultJsonHeaders,
			)
		} catch (error) {
			Sentry.captureException(error, {
				contexts: { debug_route: { path: '/api/debug/run-sync' } },
			})
			return context.json(
				{
					detail:
						error instanceof Error
							? error.message
							: typeof error === 'string'
								? error
								: 'Unknown error',
					error: 'Internal Server Error',
				},
				500,
				defaultJsonHeaders,
			)
		}
	})
	.get('/debug/db', async (context) => {
		try {
			const hyperdrive = context.env.HYPERDRIVE as { connectionString: string }
			await ensureSchema(hyperdrive)
			const database = getDatabase(hyperdrive)

			const reset = context.req.query('reset')
			if (reset === '1') {
				await database.execute(
					sql`DELETE FROM tolo.sync_state WHERE id = 'transactions'`,
				)
			}
			const txnRows = await database
				.select({ count: sql<number>`count(*)` })
				.from(transactionsTable)
			const transactionCount = txnRows[0]?.count ?? 0

			const syncCursorRows = await database
				.select({
					lastTransactionId: syncState.lastTransactionId,
					updatedAt: syncState.updatedAt,
				})
				.from(syncState)
				.where(eq(syncState.id, 'transactions'))
			const syncCursor = syncCursorRows[0]

			return context.json(
				{
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- may be undefined if no row
					lastTransactionId: syncCursor?.lastTransactionId ?? null,
					transactions: transactionCount,
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- may be undefined if no row
					updatedAt: syncCursor?.updatedAt ?? null,
				},
				200,
				defaultJsonHeaders,
			)
		} catch (error) {
			Sentry.captureException(error, {
				contexts: { debug_route: { path: '/api/debug/db' } },
			})
			return context.json(
				{
					detail:
						error instanceof Error
							? error.message
							: typeof error === 'string'
								? error
								: 'Unknown error',
					error: 'Internal Server Error',
				},
				500,
				defaultJsonHeaders,
			)
		}
	})
	.all('*', (context) => {
		captureEvent({
			extra: {
				json: context.req.text(),
				method: context.req.method,
				path: context.req.path,
				query: context.req.query(),
			},
			level: 'error',
			message: 'Hit non existing route',
			request: {
				headers: context.req.header(),
				method: context.req.method,
				query_string: context.req.query(),
				url: context.req.url,
			},
		})

		return context.json({ message: 'Forbidden' }, 403)
	})

app.onError((error, c) => {
	// eslint-disable-next-line no-console
	console.log(error)

	if (error instanceof HTTPException) {
		return error.getResponse()
	}

	return c.json({ error: 'Internal Server Error' }, 500)
})

// @ts-expect-error - scheduled handler is not typed
app.scheduled = scheduledHandler

const appWithSentry = Sentry.withSentry<Bindings>(
	(environment) => ({
		dsn: environment.SENTRY_DSN,
		enableLogs: true,
		integrations: [
			Sentry.fetchIntegration(),
			Sentry.extraErrorDataIntegration({ depth: 8 }),
		],
		sendDefaultPii: true,
		tracesSampleRate: 0.5,
	}),
	app,
)

export default appWithSentry
