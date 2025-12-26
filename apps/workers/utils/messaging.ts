import { captureException } from '@sentry/cloudflare'

import { sendPushNotificationToClient } from './push-notifications'

/**
 * Supported message types for order lifecycle events
 */
export type MessageType =
	| 'order:accepted'
	| 'order:closed'
	| 'order:created'
	| 'order:declined'
	| 'order:delivered'
	| 'order:ready'

/**
 * Message templates for each message type
 */
export const messageTemplates: Record<
	MessageType,
	{ body: string; title: string }
> = {
	'order:accepted': {
		body: '🧑🏽‍🍳 Ahora estamos trabajando en tu pedido, te avisaremos cuando esté listo',
		title: 'Pedido aceptado',
	},
	'order:created': {
		body: '📝 Tu pedido ha sido recibido. Te notificaremos cuando sea aceptado.',
		title: 'Pedido recibido',
	},
	'order:declined': {
		body: '🚨 Tu pedido no pudo ser aceptado. Comunícate con nosotros para resolverlo.',
		title: 'Pedido no aceptado',
	},
	'order:delivered': {
		body: 'Disfruta tu pedido ☕️🥐, esperamos que lo disfrutes!',
		title: 'Pedido entregado',
	},
	'order:closed': {
		body: '☕️ Tu pedido ha sido entregado. ¡Gracias por tu visita!',
		title: 'Pago confirmado',
	},
	'order:ready': {
		body: '✅ Tu pedido ya está listo, te esperamos!',
		title: 'Pedido listo',
	},
}

/**
 * Channel used for sending the message
 * Note: 'sms' and 'whatsapp' are placeholders for future Twilio integration
 */
export type MessageChannel = 'push' | 'sms' | 'whatsapp'

/**
 * Result of sending a message
 */
export type SendMessageResult = {
	channel: MessageChannel
	error?: string
	success: boolean
}

/**
 * Options for sending a message
 */
export type SendMessageOptions = {
	/** Customer ID for push notifications */
	customerId: number
	/** Additional data to include with push notifications */
	data?: Record<string, unknown>
	/** D1 database for push token lookup */
	database: D1Database
	/** Message type to send */
	messageType: MessageType
	/** Phone number for WhatsApp/SMS fallback (optional, not yet implemented) */
	phone?: null | string
	/** Preferred channels in order of priority */
	preferredChannels?: MessageChannel[]
}

/**
 * Send a message to a customer using the best available channel
 *
 * Currently only push notifications are implemented.
 * WhatsApp and SMS channels are reserved for future Twilio integration.
 *
 * @example
 * ```ts
 * await sendMessage({
 *   customerId: 123,
 *   messageType: 'order:ready',
 *   database: env.D1_TOLO,
 * })
 * ```
 */
export async function sendMessage(
	options: SendMessageOptions,
): Promise<SendMessageResult[]> {
	const {
		customerId,
		data,
		database,
		messageType,
		preferredChannels = ['push'],
	} = options

	const template = messageTemplates[messageType]
	const results: SendMessageResult[] = []

	for (const channel of preferredChannels) {
		try {
			switch (channel) {
				case 'push': {
					const pushResult = await sendPushNotificationToClient(
						customerId,
						database,
						{
							body: template.body,
							data,
							title: template.title,
						},
					)

					if (pushResult.sent > 0) {
						results.push({ channel: 'push', success: true })
						return results // Success, stop trying other channels
					}

					results.push({
						channel: 'push',
						error: 'No push tokens registered',
						success: false,
					})
					break
				}

				case 'whatsapp':
				case 'sms': {
					// TODO: Implement Twilio integration
					results.push({
						channel,
						error: 'Channel not yet implemented',
						success: false,
					})
					break
				}
			}
		} catch (error) {
			captureException(error)
			results.push({
				channel,
				error: error instanceof Error ? error.message : 'Unknown error',
				success: false,
			})
		}
	}

	return results
}

/**
 * Map processing status to message type
 */
export function getMessageTypeFromProcessingStatus(
	processingStatus: number,
): MessageType | null {
	switch (processingStatus) {
		case 10: // Open
			return 'order:created'
		case 20: // Preparing
			return 'order:accepted'
		case 30: // Ready
			return 'order:ready'
		case 50: // Delivered
			return 'order:delivered'
		case 70: // Deleted/Cancelled
			return 'order:declined'
		default:
			return null
	}
}
