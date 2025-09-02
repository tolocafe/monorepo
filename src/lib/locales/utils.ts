import { MMKV } from 'react-native-mmkv'

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
