import {
	formatPhoneNumber,
	isValidPhoneNumber,
	normalizePhoneNumber,
} from '@/lib/utils/phone'

describe('phone utilities', () => {
	describe('formatPhoneNumber', () => {
		it('formats 10-digit US phone numbers correctly', () => {
			expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
			expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567')
		})

		it('formats 11-digit US phone numbers with country code', () => {
			expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890')
			expect(formatPhoneNumber('+1 555 123 4567')).toBe('+1 (555) 123-4567')
		})

		it('returns original format for unsupported lengths', () => {
			expect(formatPhoneNumber('123')).toBe('123')
			expect(formatPhoneNumber('123456789012')).toBe('123456789012')
		})

		it('handles empty and invalid inputs', () => {
			expect(formatPhoneNumber('')).toBe('')
			expect(formatPhoneNumber('abc')).toBe('abc')
		})
	})

	describe('isValidPhoneNumber', () => {
		it('validates 10-digit US phone numbers', () => {
			expect(isValidPhoneNumber('1234567890')).toBe(true)
			expect(isValidPhoneNumber('(123) 456-7890')).toBe(true)
			expect(isValidPhoneNumber('123-456-7890')).toBe(true)
		})

		it('validates 11-digit US phone numbers with country code', () => {
			expect(isValidPhoneNumber('11234567890')).toBe(true)
			expect(isValidPhoneNumber('+1 123 456 7890')).toBe(true)
		})

		it('rejects invalid phone numbers', () => {
			expect(isValidPhoneNumber('123')).toBe(false)
			expect(isValidPhoneNumber('123456789')).toBe(false)
			expect(isValidPhoneNumber('21234567890')).toBe(false) // 11 digits not starting with 1
			expect(isValidPhoneNumber('')).toBe(false)
			expect(isValidPhoneNumber('abc')).toBe(false)
		})
	})

	describe('normalizePhoneNumber', () => {
		it('removes all non-digit characters', () => {
			expect(normalizePhoneNumber('(123) 456-7890')).toBe('1234567890')
			expect(normalizePhoneNumber('+1 555 123 4567')).toBe('15551234567')
			expect(normalizePhoneNumber('123.456.7890')).toBe('1234567890')
		})

		it('handles strings with no digits', () => {
			expect(normalizePhoneNumber('abc')).toBe('')
			expect(normalizePhoneNumber('')).toBe('')
		})

		it('preserves already normalized numbers', () => {
			expect(normalizePhoneNumber('1234567890')).toBe('1234567890')
		})
	})
})
