import { Platform } from 'react-native'

import { loadAndActivateLocale } from './load-and-activate-locale'
import { languageStorage, Locale, LOCALE_KEY } from './utils'

const canUseDOM =
	// eslint-disable-next-line unicorn/prefer-global-this, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-deprecated
	typeof window !== 'undefined' && window.document?.createElement != null
const isDevice = Platform.OS === 'ios' || Platform.OS === 'android'

const INITIAL_LOCALE = ((canUseDOM || isDevice
	? languageStorage.getString(LOCALE_KEY)
	: null) ?? 'es') as Locale

// eslint-disable-next-line unicorn/prefer-top-level-await
loadAndActivateLocale(INITIAL_LOCALE).catch(() => null)
