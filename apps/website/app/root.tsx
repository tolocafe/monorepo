import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useMatches,
} from 'react-router'

import { DEFAULT_LOCALE, isValidLocale, SUPPORTED_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'

import './app.css'
import '@/styles/global.css'
import type { Route } from './+types/root'
import { PHProvider } from './provider'

/**
 * Layout component that sets the HTML lang attribute dynamically
 * based on the current locale from URL params.
 */
export function Layout({ children }: { children: React.ReactNode }) {
	// Extract locale from URL matches
	const matches = useMatches()
	const localeMatch = matches.find(
		(match) => (match.params as { locale?: string }).locale,
	)
	const localeParam = (localeMatch?.params as { locale?: string })?.locale
	const locale: Locale = isValidLocale(localeParam)
		? localeParam
		: DEFAULT_LOCALE

	return (
		<html lang={locale}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* Add hreflang tags for SEO */}
				{SUPPORTED_LOCALES.map((loc) => (
					<link key={loc} rel="alternate" hrefLang={loc} href={`/${loc}`} />
				))}
				<Meta />
				<Links />
			</head>
			<body id="root">
				<PHProvider>
					{children}
					<ScrollRestoration />
					<Scripts />
				</PHProvider>
			</body>
		</html>
	)
}

export default function App() {
	return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!'
	let details = 'An unexpected error occurred.'
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error'
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message
		// oxlint-disable-next-line prefer-destructuring
		stack = error.stack
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
