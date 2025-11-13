import { Platform } from 'react-native'
import { getLocales } from 'expo-localization'

import { loadAndActivateLocale } from './load-and-activate-locale'
import { AVAILABLE_LOCALES, languageStorage, Locale, LOCALE_KEY } from './utils'

const canUseDOM =
	// eslint-disable-next-line unicorn/prefer-global-this, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-deprecated
	typeof window !== 'undefined' && window.document?.createElement != null
const isDevice = Platform.OS === 'ios' || Platform.OS === 'android'

function getDefaultLocale() {
	const locale = getLocales()[0].languageCode?.slice(0, 2)

	if (AVAILABLE_LOCALES.includes(locale as Locale)) {
		return locale
	}

	return 'es'
}

const INITIAL_LOCALE = ((canUseDOM || isDevice
	? languageStorage.getString(LOCALE_KEY)
	: null) ?? getDefaultLocale()) as Locale

// eslint-disable-next-line unicorn/prefer-top-level-await
loadAndActivateLocale(INITIAL_LOCALE).catch(() => null)
