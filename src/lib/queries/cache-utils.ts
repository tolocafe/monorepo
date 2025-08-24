import { MMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '@/lib/constants/storage'
import { persister, queryClient } from '@/lib/query-client'

/**
 * Clears all cached data including in-memory queries, persisted cache, and app data storage.
 * User credentials and language preferences are preserved for better user experience.
 */
export const clearAllCache = async () => {
	try {
		// Step 1: Clear all MMKV storage instances first (preserving language preferences)
		// Clear query store (used by TanStack Query persister)
		const queryStore = new MMKV({ id: 'query-store' })
		queryStore.clearAll()

		// Clear zustand store (used by order store)
		const zustandStore = new MMKV({ id: STORAGE_KEYS.ZUSTAND_STORE })
		zustandStore.clearAll()

		// Note: Language storage (default MMKV instance) and auth credentials
		// are preserved to maintain user's language preference and login state
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Failed to clear MMKV storage:', error)
	}

	try {
		// Step 2: Clear persisted cache through the persister
		await persister.removeClient()
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Failed to clear persisted cache:', error)
	}

	// Step 3: Clear in-memory cache and remove all queries
	queryClient.clear()
	queryClient.removeQueries()

	// Step 4: Invalidate all queries to ensure fresh data on next fetch
	// Don't refetch immediately - let components fetch fresh data when needed
	await queryClient.invalidateQueries()
}
