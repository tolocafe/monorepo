import { SUPPORTED_LOCALES } from '@tolo/common/locales'
import type { SupportedLocale } from '@tolo/common/locales'
import { createMMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '~/lib/constants/storage'

export const languageStorage = createMMKV({
	id: STORAGE_KEYS.SETTINGS,
})

export const LOCALE_KEY = 'tolo_language'

export const LOCALE_NAMES = {
	de: 'Deutsch',
	en: 'English',
	es: 'Español',
	fr: 'Français',
	ja: '日本語',
	pt: 'Português',
} as const satisfies Record<SupportedLocale, string>

export type Locale = SupportedLocale

export const AVAILABLE_LOCALES = SUPPORTED_LOCALES
