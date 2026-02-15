import { Hono } from 'hono'
import { z } from 'zod'

import type { Bindings } from '@/types'
import { posterApi } from '@/utils/poster'
import { sendMessage as sendTwilioMessage } from '@/utils/twilio'

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

			const twilioConfig = {
				accountSid: context.env.TWILIO_ACCOUNT_SID,
				authToken: context.env.TWILIO_AUTH_TOKEN,
				messagingServiceSid: context.env.TWILIO_MESSAGING_SERVICE_SID,
			}

			for (const client of clientsWithPhoneNumbers) {
				await sendTwilioMessage({
					body: message,
					config: twilioConfig,
					phone: client.phone,
				})
			}
		}
		if (type === 'push') {
			throw new Error('Push notifications are not supported yet')
		}

		return context.json({ message: 'Ok' }, 200)
	},
)

export default broadcast
