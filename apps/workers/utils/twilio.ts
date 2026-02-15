/**
 * Twilio Messaging Client
 *
 * Sends SMS and WhatsApp messages via the Twilio REST API using
 * Content Templates for localized messaging.
 *
 * @see https://www.twilio.com/docs/messaging/api/message-resource
 * @see https://www.twilio.com/docs/content
 */

import type { TwilioTemplateId } from './twilio-templates'
import { twilioTemplates } from './twilio-templates'

export type TwilioConfig = {
	accountSid: string
	authToken: string
	messagingServiceSid: string
}

type SmsMessage = {
	/** Raw message body */
	body: string
	channel?: 'sms'
	/** Twilio configuration */
	config: TwilioConfig
	/** Recipient phone number in E.164 format (e.g. "+521234567890") */
	phone: string
}

type WhatsAppMessage = {
	/** Will fallback to SMS if WhatsApp is not available */
	channel: 'whatsapp'
	/** Twilio configuration */
	config: TwilioConfig
	/** Language for the template */
	language?: 'en' | 'es'
	/** Recipient phone number in E.164 format (e.g. "+521234567890") */
	phone: string
	/** Template key (required for WhatsApp, Twilio falls back to SMS automatically) */
	template: TwilioTemplateId
	/** Template variables to substitute */
	variables?: Record<string, string>
}

type SendMessageOptions = SmsMessage | WhatsAppMessage

/**
 * Send a message via Twilio SMS or WhatsApp
 *
 * For WhatsApp, a template is required and the `whatsapp:` prefix
 * is automatically added to the phone number. Twilio handles
 * SMS fallback for templated WhatsApp messages automatically.
 * For SMS, a raw body is used directly.
 */
export async function sendMessage(options: SendMessageOptions) {
	const { channel = 'sms', config, phone } = options

	const to = channel === 'whatsapp' ? `whatsapp:${phone}` : phone

	const params = new URLSearchParams({
		MessagingServiceSid: config.messagingServiceSid,
		To: to,
	})

	if (channel === 'whatsapp') {
		const { language = 'es', template, variables } = options as WhatsAppMessage
		params.set('ContentSid', twilioTemplates[template][language])
		if (variables) {
			params.set('ContentVariables', JSON.stringify(variables))
		}
	} else {
		params.set('Body', (options as SmsMessage).body)
	}

	const response = await fetch(
		`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
		{
			body: params,
			headers: {
				Authorization: `Basic ${btoa(`${config.accountSid}:${config.authToken}`)}`,
			},
			method: 'POST',
		},
	)

	if (!response.ok) {
		const error = (await response.json()) as { message?: string }
		throw new Error(`Twilio API error: ${error.message ?? response.statusText}`)
	}

	return response.json() as Promise<{ sid: string; status: string }>
}
