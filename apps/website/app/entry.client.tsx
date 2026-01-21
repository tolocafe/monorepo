import { I18nProvider } from '@lingui/react'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

import { DEFAULT_LOCALE, isValidLocale } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { i18n, loadAndActivateLocale } from '@/lib/locales/load-locale'

function extractLocaleFromUrl(): Locale {
	const [localeParam] = globalThis.location.pathname.split('/').filter(Boolean)

	if (localeParam && isValidLocale(localeParam)) {
		return localeParam
	}

	return DEFAULT_LOCALE
}

// Extract locale from URL and activate it before hydration
const locale = extractLocaleFromUrl()
loadAndActivateLocale(locale)

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<I18nProvider i18n={i18n}>
				<HydratedRouter />
			</I18nProvider>
		</StrictMode>,
	)
})
