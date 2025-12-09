import { createMMKV } from 'react-native-mmkv'
import { STORAGE_KEYS } from '@/lib/constants/storage'

export const languageStorage = createMMKV({
	id: STORAGE_KEYS.SETTINGS,
})

export const LOCALE_KEY = 'tolo_language'

export const LOCALE_NAMES = {
	en: 'English',
	es: 'Español',
	fr: 'Français',
	ja: '日本語',
	pt: 'Português',
	de: 'Deutsch',
} as const

export type Locale = keyof typeof LOCALE_NAMES

export const AVAILABLE_LOCALES = Object.keys(LOCALE_NAMES) as Locale[]
