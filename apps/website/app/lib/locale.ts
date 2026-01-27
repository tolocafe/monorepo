/**
 * Locale Utilities
 *
 * Best practices for locale prefix routing:
 * 1. URL Structure: Use consistent locale prefixes (/en/, /es/)
 * 2. Default locale: Spanish (es) - can be served with or without prefix
 * 3. Accept-Language header: Used for initial locale detection
 * 4. HTML lang attribute: Set dynamically based on current locale
 * 5. SEO: Include hreflang link tags for alternate languages
 */

export const SUPPORTED_LOCALES = ['es', 'en', 'de', 'fr', 'ja'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'

export const LOCALE_LABELS: Record<Locale, string> = {
	de: 'Deutsch',
	en: 'English',
	es: 'Español',
	fr: 'Français',
	ja: '日本語',
}

/** Open Graph locale format mapping */
export const OG_LOCALES: Record<Locale, string> = {
	de: 'de_DE',
	en: 'en_US',
	es: 'es_MX',
	fr: 'fr_FR',
	ja: 'ja_JP',
}

/**
 * Validates if a string is a supported locale
 */
export function isValidLocale(locale: string | undefined): locale is Locale {
	return SUPPORTED_LOCALES.includes(locale as Locale)
}

/**
 * Detects the preferred locale from the Accept-Language header
 */
export function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
	if (!acceptLanguage) return DEFAULT_LOCALE

	// Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
	const languages = acceptLanguage
		.split(',')
		.map((lang) => {
			const [code, q = 'q=1'] = lang.trim().split(';')
			const quality = Number.parseFloat(q.replace('q=', '')) || 1
			// Get base language code (e.g., "en" from "en-US")
			const baseCode = code.split('-')[0].toLowerCase()
			return { code: baseCode, quality }
		})
		.toSorted((a, b) => b.quality - a.quality)

	// Find first supported locale
	for (const { code } of languages) {
		if (isValidLocale(code)) {
			return code
		}
	}

	return DEFAULT_LOCALE
}

/**
 * Builds a localized path
 */
export function localizedPath(path: string, locale: Locale): string {
	// Remove leading slash for consistency
	const cleanPath = path.startsWith('/') ? path.slice(1) : path

	// Don't duplicate locale prefix
	const pathWithoutLocale = cleanPath.replace(
		new RegExp(`^(${SUPPORTED_LOCALES.join('|')})/`),
		'',
	)

	return `/${locale}/${pathWithoutLocale}`.replace(/\/$/, '') || `/${locale}`
}

/**
 * Gets the current path without the locale prefix
 */
export function getPathWithoutLocale(pathname: string): string {
	const localePattern = new RegExp(`^/(${SUPPORTED_LOCALES.join('|')})(/|$)`)
	return pathname.replace(localePattern, '/') || '/'
}
