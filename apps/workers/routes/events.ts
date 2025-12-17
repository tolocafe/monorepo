import { Hono } from 'hono'

import webflow from '~workers/utils/webflow'

import { defaultJsonHeaders } from '../utils/headers'

import type { Bindings } from '../types'

const events = new Hono<{ Bindings: Bindings }>()
	.get('/', async (context) => {
		try {
			const events = await webflow.collections.listEvents(context.env)

			return context.json(events ?? [], 200, defaultJsonHeaders)
		} catch {
			return context.json(
				{ error: 'Failed to fetch events' },
				500,
				defaultJsonHeaders,
			)
		}
	})
	.get('/:id', async (context) => {
		const event = await webflow.collections.getEvent(
			context.env,
			context.req.param('id'),
		)

		return context.json(event, 200, defaultJsonHeaders)
	})

export default events
