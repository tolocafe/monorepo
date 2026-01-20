import PostHog, {
	PostHogProvider as BasePostHogProvider,
} from 'posthog-react-native'
import type { ReactNode } from 'react'

import { posthogStorage } from './storage'
import type {
	CaptureProperties,
	IdentifyProperties,
	ScreenProperties,
} from './types'

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY as string
const POSTHOG_HOST = 'https://a.tolo.cafe'

const client = new PostHog(POSTHOG_API_KEY, {
	captureAppLifecycleEvents: true,
	customStorage: posthogStorage,
	disabled: __DEV__,
	host: POSTHOG_HOST,
})

export function identify(distinctId: string, properties?: IdentifyProperties) {
	client.identify(distinctId, properties)
}

export function reset() {
	client.reset()
}

export function capture(event: string, properties?: CaptureProperties) {
	client.capture(event, properties)
}

export async function flush() {
	await client.flush()
}

export function screen(name: string, properties?: ScreenProperties) {
	client.screen(name, properties)
}

export function PostHogProvider({ children }: { children: ReactNode }) {
	return <BasePostHogProvider client={client}>{children}</BasePostHogProvider>
}

export type {
	CaptureProperties,
	IdentifyProperties,
	ScreenProperties,
} from './types'
