import { persister, queryClient } from '@/lib/query-client'

/**
 * Clears all cached data including in-memory queries and persisted cache
 */
export const clearAllCache = async () => {
	// Clear in-memory cache
	queryClient.clear()

	// Clear persisted cache
	try {
		await persister.removeClient()
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Failed to clear persisted cache:', error)
	}

// No-op: additional invalidation is unnecessary here as we fully clear the client
}
