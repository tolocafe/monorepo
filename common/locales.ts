/**
 * Supported locales across the application
 * This is the single source of truth for all language codes
 */
export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'ja', 'pt', 'de'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

/**
 * Get a supported locale from a string, with fallback
 */
export function getSupportedLocale(
	locale: string,
	fallback: SupportedLocale = SUPPORTED_LOCALES[0],
): SupportedLocale {
	return isSupportedLocale(locale) ? locale : fallback
}

/**
 * Check if a string is a supported locale
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}
