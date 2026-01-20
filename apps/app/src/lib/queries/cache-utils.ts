import { persister, queryClient, queryStore } from '@/lib/query-client'
import { zustandStore } from '@/lib/stores'

/**
 * Clears all cached data including in-memory queries, persisted cache, and app data storage.
 * User credentials and language preferences are preserved for better user experience.
 */
export const clearAllCache = async () => {
	try {
		// Step 2: Clear persisted cache through the persister
		await persister.removeClient()
	} catch (error) {
		if (__DEV__) {
			// eslint-disable-next-line no-console
			console.warn('Failed to clear persisted cache:', error)
		}
	}

	try {
		queryClient.removeQueries()
		queryStore.clearAll()
		zustandStore.clearAll()

		// Note: Language storage (default MMKV instance) and auth credentials
		// are preserved to maintain user's language preference and login state
	} catch (error) {
		if (__DEV__) {
			// eslint-disable-next-line no-console
			console.warn('Failed to clear MMKV storage:', error)
		}
	}

	// Step 3: Clear in-memory cache and remove all queries
	queryClient.clear()

	// Step 4: Invalidate all queries to ensure fresh data on next fetch
	// Don't refetch immediately - let components fetch fresh data when needed
	await queryClient.invalidateQueries()
}
