import { getLocales } from 'expo-localization'

import { canUseDOM, isDevice } from '@/lib/utils/device'

import { loadAndActivateLocale } from './load-and-activate-locale'
import { AVAILABLE_LOCALES, languageStorage, Locale, LOCALE_KEY } from './utils'

function getDefaultLocale() {
	const locale = getLocales()[0].languageCode?.slice(0, 2)

	if (AVAILABLE_LOCALES.includes(locale as Locale)) {
		return locale
	}

	return 'es'
}

export function getCurrentLocale() {
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
