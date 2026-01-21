import { i18n } from '@lingui/core'

import type { Locale } from '@/lib/locale'

import { messages as deMessages } from './de/messages.po'
import { messages as enMessages } from './en/messages.po'
import { messages as esMessages } from './es/messages.po'
import { messages as frMessages } from './fr/messages.po'
import { messages as jaMessages } from './ja/messages.po'

const catalogs: Record<Locale, { messages: Record<string, string> }> = {
	de: { messages: deMessages },
	en: { messages: enMessages },
	es: { messages: esMessages },
	fr: { messages: frMessages },
	ja: { messages: jaMessages },
}

export function loadAndActivateLocale(locale: Locale) {
	const catalog = catalogs[locale] || catalogs.es
	i18n.loadAndActivate({ locale, messages: catalog.messages })
}

export { i18n }
