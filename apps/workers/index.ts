import * as Sentry from '@sentry/cloudflare'
import { captureEvent } from '@sentry/cloudflare'
import type { SupportedLocale } from '@tolo/common/locales'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

import { jwtUserMiddleware } from './lib/jwt-user-middleware'
import type { JwtUserVariables } from './lib/jwt-user-middleware'
import { languageDetector } from './lib/language-detector'
import auth from './routes/auth'
import blog from './routes/blog'
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
import type { Bindings } from './types'
import { defaultJsonHeaders } from './utils/headers'

type Variables = JwtUserVariables & {
	language: SupportedLocale
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const TOLO_DOMAIN = 'tolo.cafe'

app
	.use(languageDetector)
	.use(jwtUserMiddleware)
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
	.route('/blog', blog)
	.route('/coffees', coffees)
	.route('/events', events)
	.route('/pos', pos)
	.route('/passes', passes)
	.route('/broadcast', broadcast)
	.route('/tables', tables)
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
