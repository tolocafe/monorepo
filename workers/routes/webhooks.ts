import { captureEvent } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { z } from 'zod/v4'

import type { Bindings } from '../types'

const posterWebhookDataSchema = z.object({
	account: z.string().optional(),
	account_number: z.string().optional(),
	action: z.string().optional(),
	data: z.string().optional(),
	object: z.string().optional(),
	object_id: z.union([z.number(), z.string()]).optional(),
	time: z.string().optional(),
	verify: z.string(),
})

const webhooks = new Hono<{ Bindings: Bindings }>()
	.get('/poster', (c) => c.json({ message: 'Ok' }, 200))
	.post('/poster', async (context) => {
		const body = (await context.req.json()) as unknown

		const parsedBody = posterWebhookDataSchema.parse(body)

		if (parsedBody.verify !== process.env.POSTER_APPLICATION_SECRET) {
			if (parsedBody.action === 'test') {
				return context.json({ message: 'Ok' }, 200)
			}

			return context.json({ message: 'Invalid signature' }, 401)
		}

		captureEvent({
			extra: { body: parsedBody },
			message: 'Poster webhook received',
		})

		const { action, data } = parsedBody

		let parsedData
		if (data) {
			try {
				parsedData = JSON.parse(data) as object
			} catch {
				//
			}
		}

		switch (action) {
			case 'added':
				if (parsedData && 'user_id' in parsedData) {
					// eslint-disable-next-line no-console
					console.log({ user_id: parsedData.user_id })
				}
				return context.json({ message: 'Ok' }, 200)
			default:
				return context.json({ message: 'Ok' }, 200)
		}
	})

export default webhooks
