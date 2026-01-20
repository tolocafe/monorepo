import { redirect } from 'react-router'

import { detectLocaleFromHeader } from '~/lib/locale'

import type { Route } from './+types/index'

/**
 * Root Index Route
 *
 * Redirects to the user's preferred locale based on:
 * 1. Accept-Language header (browser preference)
 * 2. Falls back to default locale (es)
 */
export function loader({ request }: Route.LoaderArgs) {
	const acceptLanguage = request.headers.get('Accept-Language')
	const preferredLocale = detectLocaleFromHeader(acceptLanguage)

	return redirect(`/${preferredLocale}`)
}
