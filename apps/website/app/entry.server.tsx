import { I18nProvider } from '@lingui/react'
import { isbot } from 'isbot'
import { renderToReadableStream } from 'react-dom/server'
import type { AppLoadContext, EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

import { DEFAULT_LOCALE, isValidLocale } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { i18n, loadAndActivateLocale } from '@/lib/locales/load-locale'

function extractLocaleFromUrl(url: string): Locale {
	const urlObj = new URL(url)
	const [localeParam] = urlObj.pathname.split('/').filter(Boolean)

	if (localeParam && isValidLocale(localeParam)) {
		return localeParam
	}

	return DEFAULT_LOCALE
}

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
	_loadContext: AppLoadContext,
) {
	let shellRendered = false
	const userAgent = request.headers.get('user-agent')

	// Extract locale from URL and activate it
	const locale = extractLocaleFromUrl(request.url)
	loadAndActivateLocale(locale)

	const body = await renderToReadableStream(
		<I18nProvider i18n={i18n}>
			<ServerRouter context={routerContext} url={request.url} />
		</I18nProvider>,
		{
			onError(error: unknown) {
				// oxlint-disable-next-line no-param-reassign
				responseStatusCode = 500
				// Log streaming rendering errors from inside the shell.  Don't log
				// errors encountered during initial shell rendering since they'll
				// reject and get logged in handleDocumentRequest.
				if (shellRendered) {
					// oxlint-disable-next-line no-console
					console.error(error)
				}
			},
		},
	)
	shellRendered = true

	// Ensure requests from bots and SPA Mode renders wait for all content to load before responding
	// https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
	if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
		await body.allReady
	}

	responseHeaders.set('Content-Type', 'text/html')
	return new Response(body, {
		headers: responseHeaders,
		status: responseStatusCode,
	})
}
