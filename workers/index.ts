import * as Sentry from '@sentry/cloudflare'
import { captureEvent } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

import auth from './routes/auth'
import broadcast from './routes/broadcast'
import clients from './routes/clients'
import menu from './routes/menu'
import orders from './routes/orders'
import coffees from './routes/coffees'
import passes from './routes/passes'
import receipts from './routes/receipts'
import transactions from './routes/transactions'
import webhooks from './routes/webhooks'
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
			origin: (origin) =>
				['localhost', TOLO_DOMAIN].some((domain) => origin.includes(domain))
					? origin
					: null,
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
	.route('/transactions', transactions)
	.route('/orders', orders)
	.route('/receipts', receipts)
	.route('/webhooks', webhooks)
	.route('/coffees', coffees)
	.route('/passes', passes)
	.route('/broadcast', broadcast)
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

export default Sentry.withSentry(
	(environment: { SENTRY_DSN: string }) => ({
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
