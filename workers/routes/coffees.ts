import { Hono } from 'hono'

import type { Bindings } from '../types'
import { defaultJsonHeaders } from '../utils/headers'
import webflow from 'workers/utils/webflow'

const coffees = new Hono<{ Bindings: Bindings }>()
	.get('/', async (context) => {
		try {
			const coffees = await webflow.collections.listCoffees(context.env)

			console.log('coffees', coffees)

			return context.json(coffees ?? [], 200, defaultJsonHeaders)
		} catch (error) {
			console.error('Error fetching coffees:', error)

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
