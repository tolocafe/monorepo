import { captureException } from '@sentry/cloudflare'
import { Expo } from 'expo-server-sdk'

import type { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'

export const expo = new Expo()

/**
 * Get push tokens for a client from the database
 */
export async function getClientPushTokens(
	clientId: number,
	database: D1Database,
): Promise<string[]> {
	const { results } = await database
		.prepare('SELECT token FROM push_tokens WHERE client_id = ?')
		.bind(clientId)
		.all<{ token: string }>()

	return results.map((r) => r.token).filter((t) => Expo.isExpoPushToken(t))
}

/**
 * Notify client that a redemption was made on their account
 */
export async function notifyRedemption(
	clientId: number,
	database: D1Database,
	type: 'birthday' | 'visits',
): Promise<void> {
	const message =
		type === 'birthday'
			? {
					body: '¡Feliz cumpleaños! 🎂 Tu bebida de cumpleaños ha sido canjeada',
					title: 'Bebida de cumpleaños',
				}
			: {
					body: '☕️ Se ha canjeado una bebida con tus sellos de lealtad',
					title: 'Bebida canjeada',
				}

	await sendPushNotificationToClient(clientId, database, message)
}

/**
 * Send push notifications and return tickets
 */
export async function sendPushNotifications(
	messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
	if (messages.length === 0) {
		return []
	}

	const chunks = expo.chunkPushNotifications(messages)
	const tickets: ExpoPushTicket[] = []

	for (const chunk of chunks) {
		const chunkTickets = await expo.sendPushNotificationsAsync(chunk)
		tickets.push(...chunkTickets)
	}

	return tickets
}

/**
 * Send a push notification to all devices registered for a client
 */
export async function sendPushNotificationToClient(
	clientId: number,
	database: D1Database,
	message: {
		body: string
		data?: Record<string, unknown>
		title: string
	},
): Promise<{ failed: number; sent: number }> {
	try {
		const tokens = await getClientPushTokens(clientId, database)

		if (tokens.length === 0) {
			return { failed: 0, sent: 0 }
		}

		const messages: ExpoPushMessage[] = tokens.map((token) => ({
			body: message.body,
			data: message.data,
			title: message.title,
			to: token,
		}))

		const tickets = await sendPushNotifications(messages)

		let sent = 0
		let failed = 0

		for (const ticket of tickets) {
			if (ticket.status === 'ok') {
				sent++
			} else {
				failed++
			}
		}

		return { failed, sent }
	} catch (error) {
		captureException(error)
		return { failed: 0, sent: 0 }
	}
}
