import { Hono } from 'hono'

import { defaultJsonHeaders } from '~workers/utils/headers'
import webflow from '~workers/utils/webflow'

import type { Bindings } from '../types'

const coffees = new Hono<{ Bindings: Bindings }>()
	.get('/', async (context) => {
		try {
			const coffees = await webflow.collections.listCoffees(context.env)

			return context.json(coffees ?? [], 200, defaultJsonHeaders)
		} catch {
			return context.json(
				{ error: 'Failed to fetch coffees' },
				500,
				defaultJsonHeaders,
			)
		}
	})
	.get('/:id', async (context) => {
		const coffee = await webflow.collections.getCoffee(
			context.env,
			context.req.param('id'),
		)

		return context.json(coffee, 200, defaultJsonHeaders)
	})

export default coffees
