import { useEffect } from 'react'
import { Outlet, redirect, useLocation } from 'react-router'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import {
	isValidLocale,
	detectLocaleFromHeader,
	SUPPORTED_LOCALES,
} from '@/lib/locale'
import { client } from '@/lib/sanity'
import type { Location } from '@/lib/sanity'

import type { Route } from './+types/locale-layout'

/**
 * Locale Layout Route
 *
 * This layout handles:
 * 1. Validating the locale parameter
 * 2. Providing locale context to child routes
 * 3. Rendering the Header with locale navigation
 * 4. Rendering the Footer with navigation links and locations
 * 5. Adding hreflang meta tags for SEO
 */

export async function loader({ params, request }: Route.LoaderArgs) {
	const { locale } = params

	// Validate the locale parameter
	if (!isValidLocale(locale)) {
		// Detect preferred locale from Accept-Language header
		const acceptLanguage = request.headers.get('Accept-Language')
		const preferredLocale = detectLocaleFromHeader(acceptLanguage)

		const url = new URL(request.url)

		// If the first segment is 2 chars, it looks like a failed locale attempt - strip it
		// Otherwise, it's probably a path without locale prefix - keep the entire path
		const isLikelyLocaleAttempt = locale.length === 2
		const pathToRedirect = isLikelyLocaleAttempt
			? url.pathname.replace(/^\/[^/]*/, '')
			: url.pathname

		throw redirect(
			`/${preferredLocale}${pathToRedirect}${url.search}${url.hash}`,
		)
	}

	// Fetch locations for the footer
	const locations = await client.fetch<Location[]>(
		`*[_type == "location"] | order(isMainLocation desc, name.es asc) {
			_id,
			name,
			slug,
			city,
			country,
			hours,
			isMainLocation
		}`,
	)

	return { locale, locations }
}

export function meta({ data }: Route.MetaArgs) {
	if (!data) return []

	// Generate hreflang link tags for SEO
	return SUPPORTED_LOCALES.map((loc) => ({
		href: `/${loc}`,
		hrefLang: loc,
		rel: 'alternate',
		tagName: 'link',
	}))
}

export default function LocaleLayout({ loaderData }: Route.ComponentProps) {
	const location = useLocation()

	// Enable hash navigation like "/es#visit" from anywhere in the app.
	useEffect(() => {
		if (!location.hash) return

		const id = decodeURIComponent(location.hash.slice(1))
		const tryScroll = () => {
			const el = document.getElementById(id)
			if (el) el.scrollIntoView({ block: 'start' })
		}

		// Try immediately, then again after paint (useful when navigating between routes).
		tryScroll()
		setTimeout(tryScroll, 0)
	}, [location.hash, location.pathname])

	return (
		<div
			style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
		>
			<Header />
			<Outlet context={{ locale: loaderData.locale }} />
			<Footer locations={loaderData.locations} />
		</div>
	)
}
