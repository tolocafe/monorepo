import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'

import * as posthog from '@/lib/analytics/posthog'

/** Tracks a screen view using PostHog's $screen event when the screen gains focus */
export function useTrackScreenView(
	properties: Parameters<typeof posthog.screen>[1] & {
		screenName: string
		skip?: boolean
	},
	dependencies: readonly unknown[],
) {
	const { screenName, skip } = properties ?? {}

	useFocusEffect(
		useCallback(() => {
			if (skip) return
			posthog.screen(screenName, properties)
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [screenName, skip, ...dependencies]),
	)
}
