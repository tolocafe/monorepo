import { randomUUID } from 'node:crypto'

import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'
import getPass from 'workers/utils/generate-pass'
import { authenticate } from 'workers/utils/jwt'
import { api } from 'workers/utils/poster'

import type { Bindings } from 'workers/types'

const pass = new Hono<{ Bindings: Bindings }>().get(
	'/:clientId',
	async (context) => {
		try {
			const clientId = Number.parseInt(context.req.param('clientId'), 10)
			const [authenticatedClientId, payload, token] = await authenticate(
				context,
				context.env.JWT_SECRET,
			)

			if (authenticatedClientId !== clientId) {
				return context.json(
					{
						authenticatedClientId,
						clientId,
						message: 'Forbidden, diff',
						payload,
						token,
					},
					403,
				)
			}

			const client = await api.clients.getClientById(
				context.env.POSTER_TOKEN,
				clientId,
			)

			if (!client) {
				return context.json({ message: 'Forbidden' }, 403)
			}

			// Ensure pass tables exist
			await context.env.D1_TOLO.exec(
				'CREATE TABLE IF NOT EXISTS pass_auth_tokens (client_id INTEGER PRIMARY KEY, auth_token TEXT UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
			)

			// Check if pass auth token already exists for this client
			let passAuthToken: string
			const existingToken = await context.env.D1_TOLO.prepare(
				'SELECT auth_token FROM pass_auth_tokens WHERE client_id = ?',
			)
				.bind(clientId)
				.first()

			if (existingToken) {
				passAuthToken = existingToken.auth_token as string
			} else {
				// Generate a new pass-specific auth token
				passAuthToken = randomUUID()

				// Store the auth token
				await context.env.D1_TOLO.prepare(
					'INSERT INTO pass_auth_tokens (client_id, auth_token, created_at) VALUES (?, ?, ?)',
				)
					.bind(clientId, passAuthToken, new Date().toISOString())
					.run()
			}

			const pass = await getPass(context, passAuthToken, client)

			return new Response(pass.getAsBuffer() as unknown as BodyInit, {
				headers: {
					'Content-disposition': `attachment; filename=tolo-pass.pkpass`,
					'Content-type': pass.mimeType,
				},
			})
		} catch (error) {
			captureException(error)

			return context.json({ message: 'Error generating pass' }, 500)
		}
	},
)

export default pass
