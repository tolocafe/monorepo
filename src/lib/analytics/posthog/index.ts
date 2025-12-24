import PostHog from 'posthog-react-native'

import { posthogStorage } from './storage'

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY as string
const POSTHOG_HOST = 'https://a.tolo.cafe'

console.log('POSTHOG_API_KEY', POSTHOG_API_KEY)

/**
 * PostHog client instance
 * Configured with custom MMKV storage for optimal performance
 */
export const posthog = new PostHog(POSTHOG_API_KEY, {
	captureAppLifecycleEvents: true,
	customStorage: posthogStorage,
	// Disable in development to avoid tracking test events
	disabled: __DEV__,
	host: POSTHOG_HOST,
})

export { PostHogProvider, usePostHog } from 'posthog-react-native'
