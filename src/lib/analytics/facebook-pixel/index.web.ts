/* eslint-disable max-params */
/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable unicorn/prefer-query-selector */
/* eslint-disable unicorn/prefer-global-this */

import { useEffect } from 'react'

const FACEBOOK_PIXEL_ID = '1415659902983829'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface FacebookPixel {
	(command: 'init', pixelId: string): void
	(command: 'track', event: string, parameters?: Record<string, unknown>): void
	(
		// eslint-disable-next-line @typescript-eslint/unified-signatures
		command: 'trackCustom',
		event: string,
		parameters?: Record<string, unknown>,
	): void
	callMethod?: (...arguments_: unknown[]) => void
	loaded?: boolean
	push?: (...arguments_: unknown[]) => void
	queue?: unknown[]
	version?: string
}

declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		_fbq?: unknown
		fbq: FacebookPixel
	}
}

export function FacebookPixel() {
	useEffect(() => {
		;(function (
			windowArg: typeof globalThis & Window,
			documentArg: Document,
			elementArg: string,
			scriptSrc: string,
			n?: FacebookPixel,
			t?: HTMLScriptElement,
			s?: Element,
		) {
			// @ts-expect-error valid check
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (windowArg.fbq) return

			// @ts-nocheck
			n = windowArg.fbq = function () {
				n?.callMethod
					? // @ts-expect-error valid check
						// eslint-disable-next-line prefer-spread, prefer-rest-params
						n.callMethod.apply(n, arguments)
					: // eslint-disable-next-line prefer-rest-params
						n?.queue?.push(arguments)
			}
			if (!windowArg._fbq) windowArg._fbq = n
			n.push = n as (...arguments_: unknown[]) => void
			n.loaded = !0
			n.version = '2.0'
			n.queue = []
			t = documentArg.createElement(elementArg) as HTMLScriptElement
			t.async = !0
			t.src = scriptSrc
			s = documentArg.getElementsByTagName(elementArg)[0]
			s.parentNode?.insertBefore(t as Element, s)
		})(
			window,
			document,
			'script',
			'https://connect.facebook.net/en_US/fbevents.js',
		)

		window.fbq('init', FACEBOOK_PIXEL_ID)
		window.fbq('track', 'PageView')
	}, [])

	return null
}
