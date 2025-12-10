import { describe, expect, it } from 'vitest'

import { toCents, toISO } from './sync-transactions'

describe('monetary helpers', () => {
	it('converts string amounts to cents', () => {
		expect(toCents('10.50')).toBe(1050)
		expect(toCents('0')).toBe(0)
		expect(toCents(12)).toBe(1200)
	})

	it('guards against invalid values', () => {
		expect(toCents('')).toBe(0)
		expect(toCents('abc')).toBe(0)
	})
})

describe('date helpers', () => {
	it('parses Poster datetime string to ISO', () => {
		expect(toISO('2024-01-02 03:04:05')).toBe('2024-01-02T03:04:05.000Z')
	})

	it('returns null for invalid dates', () => {
		expect(toISO('not-a-date')).toBeNull()
	})
})
