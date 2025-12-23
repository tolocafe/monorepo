/**
 * Supported locales across the application
 * This is the single source of truth for all language codes
 */
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'ja', 'pt', 'de'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

/**
 * Check if a string is a supported locale
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}

/**
 * Get a supported locale from a string, with fallback
 */
export function getSupportedLocale(
	locale: string,
	fallback: SupportedLocale = 'en',
): SupportedLocale {
	return isSupportedLocale(locale) ? locale : fallback
}
