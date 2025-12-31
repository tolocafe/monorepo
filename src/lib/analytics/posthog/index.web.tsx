import { PostHogProvider as BasePostHogProvider } from '@posthog/react'
import { posthog } from 'posthog-js'
import type { ReactNode } from 'react'

import type {
	CaptureProperties,
	IdentifyProperties,
	ScreenProperties,
} from './types'

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY as string
const POSTHOG_HOST = 'https://a.tolo.cafe'

posthog.init(POSTHOG_API_KEY, {
	api_host: POSTHOG_HOST,
	capture_pageview: true,
	capture_pageleave: true,
	loaded(posthog) {
		if (__DEV__) {
			posthog.opt_out_capturing()
		}
	},
})

export function identify(distinctId: string, properties?: IdentifyProperties) {
	posthog.identify(distinctId, properties)
}

export function reset() {
	posthog.reset()
}

export function capture(event: string, properties?: CaptureProperties) {
	posthog.capture(event, properties)
}

export function flush() {
	// posthog-js doesn't have a flush method, events are sent automatically
}

export function screen(name: string, properties?: ScreenProperties) {
	posthog.capture('$screen', { $screen_name: name, ...properties })
}

export function PostHogProvider({ children }: { children: ReactNode }) {
	return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>
}

export type {
	CaptureProperties,
	IdentifyProperties,
	ScreenProperties,
} from './types'
