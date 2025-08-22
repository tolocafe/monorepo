import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod/v4'

import { authenticate } from '../utils/jwt'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

const updateClientSchema = z.object({
	birthday: z.string().optional(),
	bonus: z.number().optional(),
	card_number: z.string().optional(),
	client_groups_id_client: z.number().optional(),
	client_id: z.number(),
	client_name: z.string().optional(),
	client_sex: z.number().optional(),
	discount_per: z.number().optional(),
	email: z.string().optional(),
	phone: z.string().optional(),
	total_payed_sum: z.number().optional(),
})

const pushTokensSchema = z.string().max(255).min(1)

const clients = new Hono<{ Bindings: Bindings }>()
	.put('/:id', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const id = c.req.param('id')

		if (!id || id !== clientId.toString()) {
			throw new HTTPException(403, { message: 'Forbidden' })
		}

		const bodyUnknown = (await c.req.json()) as unknown
		const body =
			typeof bodyUnknown === 'object' &&
			bodyUnknown !== null &&
			!Array.isArray(bodyUnknown)
				? (bodyUnknown as Record<string, unknown>)
				: {}

		const parsedBody = updateClientSchema.parse(body)

		const client = await api.clients.updateClient(
			c.env.POSTER_TOKEN,
			id,
			parsedBody,
		)

		return c.json(client)
	})
	.put('/:id/push-tokens', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const id = c.req.param('id')

		if (!id || id !== clientId.toString()) {
			throw new HTTPException(403, { message: 'Forbidden' })
		}

		const bodyUnknown = (await c.req.json()) as unknown
		const body = pushTokensSchema.parse(bodyUnknown)

		await c.env.D1_TOLO.exec(
			'CREATE TABLE IF NOT EXISTS push_tokens (client_id INTEGER, token TEXT, created_at TIMESTAMP, last_used TIMESTAMP, PRIMARY KEY (client_id, token))',
		)

		try {
			await c.env.D1_TOLO.prepare(
				'INSERT INTO push_tokens (client_id, token, created_at, last_used) VALUES (?, ?, ?, ?)',
			)
				.bind(id, body, new Date().toISOString(), new Date().toISOString())
				.run()
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes('UNIQUE constraint failed')
			) {
				return c.json({ error: 'Token already exists' }, 400)
			}

			throw error
		}
	})

export default clients
