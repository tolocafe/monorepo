import { usePostHog } from '@posthog/react'
import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * Hook to automatically track page views with PostHog
 * Call this in your route components to track page views
 */
export function usePageTracking() {
	const posthog = usePostHog()
	const location = useLocation()

	useEffect(() => {
		if (posthog) {
			posthog.capture('$pageview')
		}
	}, [location.pathname, posthog])
}
