import { i18n } from '@lingui/core'
import * as Sentry from '@sentry/react-native'

import { messages as esMessages } from '@/lib/locales/es/messages.po'
import { queryClient } from '@/lib/query-client'

import { Locale, LOCALE_KEY, languageStorage } from './utils'

let isLoadingLocale = false

export async function loadAndActivateLocale(locale: Locale): Promise<void> {
	// If we're already loading this locale, skip
	if (isLoadingLocale && i18n.locale === locale) {
		return
	}

	isLoadingLocale = true

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
			case 'de': {
				const { messages } = await import('@/lib/locales/de/messages.po')
				i18n.loadAndActivate({ locale, messages })
				break
			}
			default: {
				i18n.loadAndActivate({ locale: 'es', messages: esMessages })
				break
			}
		}

		languageStorage.set(LOCALE_KEY, locale)
		queryClient.invalidateQueries({ queryKey: ['menu'] })
		queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
		queryClient.invalidateQueries({ queryKey: ['events'] })
	} catch (error) {
		Sentry.captureException(error, {
			extra: { currentLocale: i18n.locale, language: locale },
			tags: { feature: 'i18n', operation: 'loadLanguageMessages' },
		})
		throw error
	} finally {
		isLoadingLocale = false
	}
}
