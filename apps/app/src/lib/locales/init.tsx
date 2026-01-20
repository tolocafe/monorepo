import { i18n } from '@lingui/core'
import { getLocales } from 'expo-localization'

import { canUseDOM, isDevice } from '~/lib/utils/device'

import { loadAndActivateLocale } from './load-and-activate-locale'
import { AVAILABLE_LOCALES, languageStorage, Locale, LOCALE_KEY } from './utils'

function getDefaultLocale() {
	const locale = getLocales()[0].languageCode?.slice(0, 2)

	if (AVAILABLE_LOCALES.includes(locale as Locale)) {
		return locale
	}

	return AVAILABLE_LOCALES[0]
}

export function getCurrentLocale() {
	// If i18n has an active locale, use it (it's the source of truth once activated)
	if (i18n.locale && AVAILABLE_LOCALES.includes(i18n.locale as Locale)) {
		return i18n.locale as Locale
	}

	// Otherwise fall back to storage or default
	if (isDevice || canUseDOM) {
		return languageStorage.getString(LOCALE_KEY) ?? null
	}

	return getDefaultLocale()
}

const INITIAL_LOCALE = ((canUseDOM || isDevice
	? languageStorage.getString(LOCALE_KEY)
	: null) ?? getDefaultLocale()) as Locale

// eslint-disable-next-line unicorn/prefer-top-level-await
loadAndActivateLocale(INITIAL_LOCALE).catch(() => null)
