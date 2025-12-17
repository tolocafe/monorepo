import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { HTTPError } from 'ky'
import { createMMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '@/lib/constants/storage'

// Cache time constants - gcTime must be >= maxAge for persistence to work correctly
const FIVE_MINUTES = 1000 * 60 * 5
const ONE_HOUR = 1000 * 60 * 60

export const queryStore = createMMKV({
	id: STORAGE_KEYS.QUERY,
})

export const storage = {
	getItem: (key: string) => queryStore.getString(key) ?? null,
	removeItem: (key: string) => void queryStore.remove(key),
	setItem: (key: string, value: string) => queryStore.set(key, value),
}

// Create the persister with maxAge matching gcTime
export const persister = createAsyncStoragePersister({
	key: 'REACT_QUERY_OFFLINE_CACHE',
	storage,
})

// Max age for persisted cache - must be <= gcTime
export const persistMaxAge = ONE_HOUR

function retryDelay(attemptIndex: number, error: unknown) {
	if (error instanceof HTTPError && error.response.headers.get('Retry-After')) {
		return Number.parseInt(error.response.headers.get('Retry-After') ?? '0', 10)
	}

	return Math.min(1000 * 2 ** attemptIndex, 10_000)
}

function shouldRetry(failureCount: number, error: unknown): boolean {
	if (error instanceof HTTPError) {
		if (
			error.request.url.includes('orders') ||
			error.request.url.includes('transactions')
		) {
			return false
		}

		const status = error.response.status
		if (status >= 400 && status < 500) {
			return false
		}
	}

	const isNoTokenError =
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		(error.message as string).includes('No auth token found')

	return !isNoTokenError && failureCount < 3
}

// Create and export the query client
export const queryClient = new QueryClient({
	defaultOptions: {
		mutations: {
			networkMode: 'online',
			retry: shouldRetry,
			retryDelay,
		},
		queries: {
			// gcTime must be >= staleTime and >= persistMaxAge for proper caching
			gcTime: ONE_HOUR,
			networkMode: 'offlineFirst',
			refetchOnReconnect: true,
			refetchOnWindowFocus: true,
			retry: shouldRetry,
			retryDelay,
			// staleTime enables SWR: data is shown from cache while revalidating in background
			staleTime: FIVE_MINUTES,
		},
	},
})
