import { Platform } from 'react-native'

import { MMKV } from 'react-native-mmkv'

import { loadAndActivateLocale } from './load-and-activate-locale'

export const languageStorage = new MMKV()

export const LOCALE_KEY = 'tolo_language'

export const LOCALE_NAMES = {
	en: 'English',
	es: 'Español',
	fr: 'Français',
	ja: '日本語',
	pt: 'Protégées',
} as const

export type Locale = keyof typeof LOCALE_NAMES

const canUseDOM =
	// eslint-disable-next-line unicorn/prefer-global-this, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-deprecated
	typeof window !== 'undefined' && window.document?.createElement != null
const isDevice = Platform.OS === 'ios' || Platform.OS === 'android'

const INITIAL_LOCALE = ((canUseDOM || isDevice
	? languageStorage.getString(LOCALE_KEY)
	: null) ?? 'es') as Locale

// eslint-disable-next-line unicorn/prefer-top-level-await
loadAndActivateLocale(INITIAL_LOCALE).catch(() => null)
