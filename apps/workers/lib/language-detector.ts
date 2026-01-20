import { SUPPORTED_LOCALES } from '@tolo/common/locales'
import type { SupportedLocale } from '@tolo/common/locales'
import type { Context, MiddlewareHandler } from 'hono'

import type { Bindings } from '@/types'

type Variables = {
	language: SupportedLocale
}

/**
 * Custom language detection middleware that properly handles browser Accept-Language headers
 *
 * Parses the Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8") and:
 * 1. Extracts language codes and quality values
 * 2. Sorts by quality value (highest first)
 * 3. Finds the first supported language
 * 4. Falls back to the default locale if no match
 *
 * Sets the detected language in context.Variables.language for downstream middleware/routes
 */
export const languageDetector: MiddlewareHandler<{
	Bindings: Bindings
	Variables: Variables
}> = async (context: Context, next) => {
	const acceptLanguage = context.req.header('Accept-Language') || ''

	// Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
	const languages = acceptLanguage
		.split(',')
		.map((lang) => {
			const [code, qValue] = lang.trim().split(';')
			const q = qValue ? Number.parseFloat(qValue.split('=')[1]) : 1
			// Extract just the language code (e.g., "en" from "en-US")
			const languageCode = code.split('-')[0].toLowerCase()
			return { code: languageCode, q }
		})
		.toSorted((a, b) => b.q - a.q) // Sort by quality value (highest first)

	// Find first supported language
	const detectedLanguage = languages.find((lang) =>
		SUPPORTED_LOCALES.includes(lang.code as SupportedLocale),
	)?.code as SupportedLocale | undefined

	context.set('language', detectedLanguage || SUPPORTED_LOCALES[0])

	await next()
}
