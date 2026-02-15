import { captureException } from '@sentry/cloudflare'

import { sendPushNotificationToClient } from './push-notifications'
import { sendMessage as sendTwilioMessage } from './twilio'

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
	'order:closed': {
		body: '☕️ Tu pedido ha sido entregado. ¡Gracias por tu visita!',
		title: 'Pago confirmado',
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
	'order:ready': {
		body: '✅ Tu pedido ya está listo, te esperamos!',
		title: 'Pedido listo',
	},
}

/**
 * Channel used for sending the message
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
	/** Phone number for WhatsApp/SMS (E.164 format) */
	phone?: null | string
	/** Twilio credentials for SMS/WhatsApp channels */
	twilioConfig?: {
		accountSid: string
		authToken: string
		messagingServiceSid: string
	}
	/** Preferred channels in order of priority */
	preferredChannels?: MessageChannel[]
}

/**
 * Send a message to a customer using the best available channel
 *
 * Tries channels in order of preference, stopping on first success.
 * Push notifications, SMS, and WhatsApp are supported via Twilio.
 */
export async function sendMessage(
	options: SendMessageOptions,
): Promise<SendMessageResult[]> {
	const {
		customerId,
		data,
		database,
		messageType,
		phone,
		preferredChannels = ['push'],
		twilioConfig,
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

				case 'whatsapp': {
					if (!twilioConfig || !phone) {
						results.push({
							channel,
							error: !twilioConfig
								? 'Twilio not configured'
								: 'No phone number provided',
							success: false,
						})
						break
					}

					await sendTwilioMessage({
						channel: 'whatsapp',
						config: twilioConfig,
						phone,
						template: messageType,
					})

					results.push({ channel, success: true })
					return results
				}

				case 'sms': {
					if (!twilioConfig || !phone) {
						results.push({
							channel,
							error: !twilioConfig
								? 'Twilio not configured'
								: 'No phone number provided',
							success: false,
						})
						break
					}

					await sendTwilioMessage({
						body: template.body,
						config: twilioConfig,
						phone,
					})

					results.push({ channel, success: true })
					return results
				}
				default: {
					void 0
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
		case 10: {
			// Open
			return 'order:created'
		}
		case 20: {
			// Preparing
			return 'order:accepted'
		}
		case 30: {
			// Ready
			return 'order:ready'
		}
		case 50: {
			// Delivered
			return 'order:delivered'
		}
		case 70: {
			// Deleted/Cancelled
			return 'order:declined'
		}
		default: {
			return null
		}
	}
}
