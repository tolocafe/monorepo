import { i18n } from '@lingui/core'
import { Locale, LOCALE_KEY, languageStorage } from './init'
import * as Sentry from '@sentry/react-native'
import { messages as esMessages } from '@/lib/locales/es/messages.po'

export async function loadAndActivateLocale(locale: Locale): Promise<void> {
	try {
		switch (locale) {
			case 'en': {
				const { messages } = await import('@/lib/locales/en/messages.po')
				i18n.loadAndActivate({ locale, messages })
				break
			}
			case 'fr': {
				const { messages } = await import('@/lib/locales/fr/messages.po')
				i18n.loadAndActivate({ locale, messages })
				break
			}
			case 'ja': {
				const { messages } = await import('@/lib/locales/ja/messages.po')
				i18n.loadAndActivate({ locale, messages })
				break
			}
			case 'pt': {
				const { messages } = await import('@/lib/locales/pt/messages.po')
				i18n.loadAndActivate({ locale, messages })
				break
			}
			default:
				i18n.loadAndActivate({ locale: 'es', messages: esMessages })
				break
		}

		languageStorage.set(LOCALE_KEY, locale)
	} catch (error) {
		Sentry.captureException(error, {
			extra: { currentLocale: i18n.locale, language: locale },
			tags: { feature: 'i18n', operation: 'loadLanguageMessages' },
		})
		throw error
	}
}
