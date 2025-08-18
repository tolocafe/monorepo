import * as Sentry from '@sentry/cloudflare'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

import auth from './routes/auth'
import clients from './routes/clients'
import menu from './routes/menu'
import orders from './routes/orders'
import transactions from './routes/transactions'
import { defaultJsonHeaders } from './utils/headers'

import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.use(
	'*',
	cors({
		credentials: true,
		origin: (origin) => origin,
	}),
)

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

app.onError((error, c) => {
	if (process.env.NODE_ENV === 'development') {
		// eslint-disable-next-line no-console
		console.log(error)
	}

	if (error instanceof HTTPException) {
		return error.getResponse()
	}

	return c.json({ error: 'Internal Server Error' }, 500)
})

export default Sentry.withSentry(
	(environment: { SENTRY_DSN: string }) => ({
		dsn: environment.SENTRY_DSN,
		enableLogs: true,
		sendDefaultPii: true,
		tracesSampleRate: 0.5,
	}),
	app,
)
