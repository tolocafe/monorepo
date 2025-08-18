import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { HTTPError } from 'ky'
import { MMKV } from 'react-native-mmkv'

const queryStore = new MMKV({
	id: 'query-store',
})

export const storage = {
	getItem: (key: string) => queryStore.getString(key) ?? null,
	removeItem: (key: string) => queryStore.delete(key),
	setItem: (key: string, value: string) => queryStore.set(key, value),
}

// Create the persister
export const persister = createAsyncStoragePersister({
	key: 'REACT_QUERY_OFFLINE_CACHE',
	storage,
})

function shouldRetry(failureCount: number, error: unknown): boolean {
	if (error instanceof HTTPError) {
		if (
			error.request.url.includes('orders') ||
			error.request.url.includes('transactions')
		) {
			return false
		}

		const status = error.response.status
		if (status >= 400 && status < 500) return false
	}

	return failureCount < 3
}

// Create and export the query client
export const queryClient = new QueryClient({
	defaultOptions: {
		mutations: {
			networkMode: 'offlineFirst',
			retry: shouldRetry,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
		},
		queries: {
			gcTime: 1000 * 60 * 60, // 1 hour - keep in cache for 1 hour when unused
			networkMode: 'offlineFirst',
			refetchOnReconnect: true,
			refetchOnWindowFocus: true,
			retry: shouldRetry,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
			staleTime: 0, // 5 minutes - data is fresh for 5 minutes
		},
	},
})
