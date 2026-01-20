import { describe, expect, it } from '@jest/globals'

import { STORAGE_KEYS } from '../storage'

describe('storage', () => {
	describe('STORAGE_KEYS', () => {
		it('should have correct key values', () => {
			expect(STORAGE_KEYS.AUTH_SESSION).toBe('auth_session')
			expect(STORAGE_KEYS.ZUSTAND).toBe('zustand_store')
			expect(STORAGE_KEYS.POSTHOG).toBe('posthog_store')
			expect(STORAGE_KEYS.QUERY).toBe('query_store')
			expect(STORAGE_KEYS.SETTINGS).toBe('settings_store')
		})

		it('should have string values for all keys', () => {
			for (const value of Object.values(STORAGE_KEYS)) {
				expect(typeof value).toBe('string')
			}
		})

		it('should have exactly 5 keys', () => {
			expect(Object.keys(STORAGE_KEYS)).toHaveLength(5)
		})
	})
})
