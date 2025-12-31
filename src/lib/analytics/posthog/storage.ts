import type { PostHogCustomStorage } from 'posthog-react-native'
import { createMMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '@/lib/constants/storage'
import { canUseDOM, isDevice } from '@/lib/utils/device'

/**
 * MMKV instance for PostHog persistence
 */
export const posthogStore = createMMKV({
	id: STORAGE_KEYS.POSTHOG,
})

/**
 * Custom MMKV storage adapter for PostHog
 * Provides AsyncStorage-compatible interface using MMKV for better performance
 */
export const posthogStorage: PostHogCustomStorage = {
	getItem: (key: string) => {
		if (!canUseDOM || isDevice) return null

		return posthogStore.getString(key) ?? null
	},
	setItem(key: string, value: string) {
		if (!canUseDOM || isDevice) return

		posthogStore.set(key, value)
	},
}
