import { Hono } from 'hono'
import { z } from 'zod'

import type { Bindings } from '@/types'
import { posterApi, sendSms } from '@/utils/poster'

const broadcastBodySchema = z.strictObject({
	message: z.string().max(255).min(1),
	secret: z.string().max(255).min(1),
	type: z.enum(['sms', 'push']).default('sms'),
})

const broadcast = new Hono<{ Bindings: Bindings }>().post(
	'/',
	async (context) => {
		const { message, secret, type } = broadcastBodySchema.parse(
			await context.req.json(),
		)

		if (secret !== context.env.BROADCAST_SECRET) {
			return context.json({ message: 'Forbidden' }, 403)
		}

		const clients = await posterApi.clients.getClients(context.env.POSTER_TOKEN)

		if (type === 'sms') {
			const clientsWithPhoneNumbers = clients.filter((client) =>
				Boolean(client.phone),
			)

			for (const client of clientsWithPhoneNumbers) {
				await sendSms(context.env.POSTER_TOKEN, client.phone, message)
			}
		}
		if (type === 'push') {
			throw new Error('Push notifications are not supported yet')
		}

		return context.json({ message: 'Ok' }, 200)
	},
)

export default broadcast
