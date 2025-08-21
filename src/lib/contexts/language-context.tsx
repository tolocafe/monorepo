import { createContext, useContext, useEffect, useState } from 'react'

import { i18n } from '@lingui/core'
import * as Sentry from '@sentry/react-native'
import { MMKV } from 'react-native-mmkv'

type LanguageContextType = {
	changeLanguage: (language: Language) => Promise<void>
	currentLanguage: Language
	isReady: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
)

const storage = new MMKV()
const LANGUAGE_KEY = 'tolo_language'

type LanguageProviderProps = {
	children: React.ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
	const [currentLanguage, setCurrentLanguage] = useState<Language>('es')
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		// Initialize i18n on mount
		const initializeLanguage = async () => {
			try {
				// Get stored language or default to 'es' (Spanish)
				const storedLanguage = storage.getString(LANGUAGE_KEY) as
					| Language
					| undefined
				const language = isValidLanguage(storedLanguage) ? storedLanguage : 'es'

				await loadLanguageMessages(language)
				setCurrentLanguage(language)
				setIsReady(true)
			} catch (error) {
				Sentry.captureException(error, {
					tags: { feature: 'i18n', operation: 'initializeLanguage' },
				})

				// Fallback to Spanish if something goes wrong
				try {
					await loadLanguageMessages('es')
					setCurrentLanguage('es')
				} catch (fallbackError) {
					Sentry.captureException(fallbackError, {
						tags: { feature: 'i18n', operation: 'initializeLanguageFallback' },
					})
				}
				setIsReady(true)
			}
		}

		void initializeLanguage()
	}, [])

	const changeLanguage = async (language: Language) => {
		try {
			// Load the new language messages first
			await loadLanguageMessages(language)
			// Only update state and storage after successful load
			storage.set(LANGUAGE_KEY, language)
			setCurrentLanguage(language)
		} catch (error) {
			Sentry.captureException(error, {
				extra: { currentLanguage, targetLanguage: language },
				tags: { feature: 'i18n', operation: 'changeLanguage' },
			})
			// On error, try to reload current language to maintain consistency
			try {
				await loadLanguageMessages(currentLanguage)
			} catch (fallbackError) {
				Sentry.captureException(fallbackError, {
					tags: { feature: 'i18n', operation: 'changeLanguageFallback' },
				})
			}
		}
	}

	// Don't render children until i18n is initialized
	if (!isReady) {
		return null
	}

	return (
		<LanguageContext.Provider
			value={{ changeLanguage, currentLanguage, isReady }}
		>
			{children}
		</LanguageContext.Provider>
	)
}

export function useLanguage() {
	const context = useContext(LanguageContext)
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider')
	}
	return context
}

/**
 * Loads and activates language messages
 */
/**
 * Available languages in the app
 */
export const AVAILABLE_LANGUAGES = ['en', 'es', 'fr', 'pt', 'ja'] as const

type Language = (typeof AVAILABLE_LANGUAGES)[number]

/**
 * Language display names
 */
export const LANGUAGE_NAMES: Record<Language, string> = {
	en: 'English',
	es: 'Español',
	fr: 'Français',
	ja: '日本語',
	pt: 'Português',
} as const

/**
 * Check if a language is valid
 */
function isValidLanguage(language: unknown): language is Language {
	return (
		typeof language === 'string' &&
		AVAILABLE_LANGUAGES.includes(language as Language)
	)
}

async function loadLanguageMessages(language: Language): Promise<void> {
	try {
		switch (language) {
			case 'es': {
				const { messages } = await import('@/lib/locales/es/messages.po')
				i18n.loadAndActivate({ locale: 'es', messages })
				break
			}
			case 'fr': {
				const { messages } = await import('@/lib/locales/fr/messages.po')
				i18n.loadAndActivate({ locale: 'fr', messages })
				break
			}
			case 'ja': {
				const { messages } = await import('@/lib/locales/ja/messages.po')
				i18n.loadAndActivate({ locale: 'ja', messages })
				break
			}
			case 'pt': {
				const { messages } = await import('@/lib/locales/pt/messages.po')
				i18n.loadAndActivate({ locale: 'pt', messages })
				break
			}
			default: {
				// Default to English
				const { messages } = await import('@/lib/locales/en/messages.po')
				i18n.loadAndActivate({ locale: 'en', messages })
				break
			}
		}

		// Ensure activation was successful
		if (!i18n.locale) {
			throw new Error(`Failed to activate locale: ${language}`)
		}
	} catch (error) {
		Sentry.captureException(error, {
			extra: { currentLocale: i18n.locale, language },
			tags: { feature: 'i18n', operation: 'loadLanguageMessages' },
		})
		throw error
	}
}
