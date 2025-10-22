import { describe, expect, it } from '@jest/globals'

import { STORAGE_KEYS } from '../storage'

describe('storage', () => {
	describe('STORAGE_KEYS', () => {
		it('should have AUTH_SESSION key', () => {
			expect(STORAGE_KEYS.AUTH_SESSION).toBe('auth_session')
		})

		it('should have ZUSTAND_STORE key', () => {
			expect(STORAGE_KEYS.ZUSTAND_STORE).toBe('zustand_store')
		})

		it('should have all required storage keys', () => {
			expect(STORAGE_KEYS).toHaveProperty('AUTH_SESSION')
			expect(STORAGE_KEYS).toHaveProperty('ZUSTAND_STORE')
		})

		it('should have string values for all keys', () => {
			for (const value of Object.values(STORAGE_KEYS)) {
				expect(typeof value).toBe('string')
			}
		})

		it('should have exactly 2 keys', () => {
			expect(Object.keys(STORAGE_KEYS)).toHaveLength(2)
		})
	})
})
