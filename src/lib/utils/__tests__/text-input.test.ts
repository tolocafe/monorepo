import { describe, expect, it } from 'vitest'

import {
	filterDigitsOnly,
	filterDigitsWithLimit,
	isDigitsOnly,
} from '../text-input'

describe('text-input utils', () => {
	describe('filterDigitsOnly', () => {
		it('should remove all non-digit characters', () => {
			expect(filterDigitsOnly('123abc456')).toBe('123456')
			expect(filterDigitsOnly('abc')).toBe('')
			expect(filterDigitsOnly('123')).toBe('123')
			expect(filterDigitsOnly('')).toBe('')
			expect(filterDigitsOnly('1a2b3c4d5e')).toBe('12345')
			expect(filterDigitsOnly('!@#$%^&*()')).toBe('')
		})

		it('should handle special characters and spaces', () => {
			expect(filterDigitsOnly('1 2 3')).toBe('123')
			expect(filterDigitsOnly('(555) 123-4567')).toBe('5551234567')
			expect(filterDigitsOnly('+1-555-123-4567')).toBe('15551234567')
		})
	})

	describe('filterDigitsWithLimit', () => {
		it('should filter digits and apply length limit', () => {
			expect(filterDigitsWithLimit('123abc456', 5)).toBe('12345')
			expect(filterDigitsWithLimit('123456789', 3)).toBe('123')
			expect(filterDigitsWithLimit('abc', 5)).toBe('')
			expect(filterDigitsWithLimit('123', 5)).toBe('123')
		})

		it('should handle zero limit', () => {
			expect(filterDigitsWithLimit('123456', 0)).toBe('')
		})

		it('should handle negative limit gracefully', () => {
			expect(filterDigitsWithLimit('123456', -1)).toBe('')
		})
	})

	describe('isDigitsOnly', () => {
		it('should return true for strings with only digits', () => {
			expect(isDigitsOnly('123')).toBe(true)
			expect(isDigitsOnly('0')).toBe(true)
			expect(isDigitsOnly('')).toBe(true) // empty string is considered valid
		})

		it('should return false for strings with non-digits', () => {
			expect(isDigitsOnly('123a')).toBe(false)
			expect(isDigitsOnly('abc')).toBe(false)
			expect(isDigitsOnly('12.3')).toBe(false)
			expect(isDigitsOnly('1 2 3')).toBe(false)
			expect(isDigitsOnly('+123')).toBe(false)
		})
	})
})
