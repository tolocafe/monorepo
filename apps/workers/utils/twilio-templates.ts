/**
 * Twilio Content Template IDs
 *
 * Maps message types to Twilio Content API template SIDs for each
 * supported language. Templates are managed in the Twilio Console
 * under Content > Content Templates.
 *
 * @see https://www.twilio.com/docs/content
 */

type TemplateLanguage = 'en' | 'es'

type TemplateDefinition = Record<TemplateLanguage, string>

export const twilioTemplates = {
	'auth:otp_verification': {
		en: '',
		es: '',
	},
	'order:accepted': {
		en: '',
		es: '',
	},
	'order:closed': {
		en: '',
		es: '',
	},
	'order:created': {
		en: '',
		es: '',
	},
	'order:declined': {
		en: '',
		es: '',
	},
	'order:delivered': {
		en: '',
		es: '',
	},
	'order:ready': {
		en: '',
		es: '',
	},
} as const satisfies Record<string, TemplateDefinition>

export type TwilioTemplateId = keyof typeof twilioTemplates
