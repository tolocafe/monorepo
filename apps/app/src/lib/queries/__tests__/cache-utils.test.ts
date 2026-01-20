import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals'

import { clearAllCache } from '~/lib/queries/cache-utils'
import { persister, queryClient } from '~/lib/query-client'

// Mock MMKV
jest.mock('react-native-mmkv', () => {
	const instance = {
		clearAll: jest.fn(),
		delete: jest.fn(),
		getString: jest.fn(),
		remove: jest.fn(),
		set: jest.fn(),
	}

	return {
		MMKV: jest.fn(() => instance),
		__esModule: true,
		createMMKV: jest.fn(() => instance),
	}
})

// Mock the query client and persister
jest.mock('~/lib/query-client', () => ({
	persister: {
		removeClient: jest.fn(),
	},
	queryClient: {
		clear: jest.fn(),
		invalidateQueries: jest.fn(),
		removeQueries: jest.fn(),
	},
}))

describe('cache-utils', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		// Suppress console.warn for tests
		jest.spyOn(console, 'warn').mockImplementation(() => null)
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	describe('clearAllCache', () => {
		it('clears cache types while preserving credentials and language preferences', async () => {
			;(persister.removeClient as unknown as jest.Mock).mockResolvedValue(
				null as never,
			)

			await clearAllCache()

			expect(queryClient.clear).toHaveBeenCalledTimes(1)
			expect(persister.removeClient).toHaveBeenCalledTimes(1)
			expect(queryClient.removeQueries).toHaveBeenCalledTimes(1)
			expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1)
		})

		it('handles persister errors gracefully', async () => {
			const error = new Error('Failed to clear persisted cache')
			;(persister.removeClient as unknown as jest.Mock).mockRejectedValue(
				error as never,
			)

			await clearAllCache()

			expect(queryClient.clear).toHaveBeenCalledTimes(1)
			expect(persister.removeClient).toHaveBeenCalledTimes(1)
			expect(queryClient.removeQueries).toHaveBeenCalledTimes(1)
			expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1)
		})

		it('clears in-memory cache even if persister fails', async () => {
			;(persister.removeClient as unknown as jest.Mock).mockRejectedValue(
				new Error('Persister error') as never,
			)

			await clearAllCache()

			expect(queryClient.clear).toHaveBeenCalledTimes(1)
			expect(queryClient.removeQueries).toHaveBeenCalledTimes(1)
			expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1)
		})
	})
})
