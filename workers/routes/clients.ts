import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { authenticate } from '../utils/jwt'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

const clients = new Hono<{ Bindings: Bindings }>().put('/:id', async (c) => {
	const clientIdFromToken = await authenticate(c, c.env.JWT_SECRET)
	const id = c.req.param('id')

	if (!id || id !== clientIdFromToken.toString())
		throw new HTTPException(403, { message: 'Forbidden' })

	const bodyUnknown = (await c.req.json()) as unknown
	const body =
		typeof bodyUnknown === 'object' &&
		bodyUnknown !== null &&
		!Array.isArray(bodyUnknown)
			? (bodyUnknown as Record<string, unknown>)
			: {}

	const client = await api.clients.updateClient(c.env.POSTER_TOKEN, id, body)

	return c.json(client)
})

export default clients
