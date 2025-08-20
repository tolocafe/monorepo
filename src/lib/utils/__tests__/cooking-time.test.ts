import { describe, expect, it } from 'vitest'

import { formatCookingTime } from '../cooking-time'

describe('formatCookingTime', () => {
	describe('invalid inputs', () => {
		it('returns empty string for zero seconds', () => {
			expect(formatCookingTime(0)).toBe('')
		})

		it('returns empty string for negative numbers', () => {
			expect(formatCookingTime(-30)).toBe('')
		})

		it('returns empty string for non-numeric strings', () => {
			expect(formatCookingTime('abc')).toBe('')
		})

		it('returns empty string for NaN', () => {
			expect(formatCookingTime(Number.NaN)).toBe('')
		})

		it('returns empty string for Infinity', () => {
			expect(formatCookingTime(Number.POSITIVE_INFINITY)).toBe('')
		})
	})

	describe('seconds format (< 60 seconds)', () => {
		it('formats 1 second correctly', () => {
			expect(formatCookingTime(1)).toBe('1 sec')
		})

		it('formats 30 seconds correctly', () => {
			expect(formatCookingTime(30)).toBe('30 sec')
		})

		it('formats 59 seconds correctly', () => {
			expect(formatCookingTime(59)).toBe('59 sec')
		})

		it('handles string input for seconds', () => {
			expect(formatCookingTime('45')).toBe('45 sec')
		})
	})

	describe('minutes format (60 seconds - 59 minutes)', () => {
		it('formats exactly 1 minute correctly', () => {
			expect(formatCookingTime(60)).toBe('1 min')
		})

		it('formats 2 minutes correctly', () => {
			expect(formatCookingTime(120)).toBe('2 min')
		})

		it('formats 5 minutes correctly', () => {
			expect(formatCookingTime(300)).toBe('5 min')
		})

		it('formats 59 minutes correctly', () => {
			expect(formatCookingTime(3540)).toBe('59 min')
		})

		it('handles partial minutes by flooring', () => {
			expect(formatCookingTime(90)).toBe('1 min') // 1.5 minutes -> 1 min
			expect(formatCookingTime(150)).toBe('2 min') // 2.5 minutes -> 2 min
		})

		it('handles string input for minutes', () => {
			expect(formatCookingTime('300')).toBe('5 min')
		})
	})

	describe('hours format (60+ minutes)', () => {
		it('formats exactly 1 hour correctly', () => {
			expect(formatCookingTime(3600)).toBe('1 hr')
		})

		it('formats 2 hours correctly', () => {
			expect(formatCookingTime(7200)).toBe('2 hr')
		})

		it('formats 1 hour 30 minutes correctly', () => {
			expect(formatCookingTime(5400)).toBe('1 hr 30 min')
		})

		it('formats 2 hours 15 minutes correctly', () => {
			expect(formatCookingTime(8100)).toBe('2 hr 15 min')
		})

		it('formats 1 hour 1 minute correctly', () => {
			expect(formatCookingTime(3660)).toBe('1 hr 1 min')
		})

		it('formats large durations correctly', () => {
			expect(formatCookingTime(10_800)).toBe('3 hr') // 3 hours exactly
			expect(formatCookingTime(14_400)).toBe('4 hr') // 4 hours exactly
		})

		it('handles string input for hours', () => {
			expect(formatCookingTime('5400')).toBe('1 hr 30 min')
		})
	})

	describe('edge cases', () => {
		it('handles floating point seconds by truncating', () => {
			expect(formatCookingTime(30.7)).toBe('30 sec')
			expect(formatCookingTime(90.9)).toBe('1 min')
		})

		it('handles very large numbers', () => {
			expect(formatCookingTime(86_400)).toBe('24 hr') // 1 day
			expect(formatCookingTime(90_000)).toBe('25 hr') // 25 hours
		})
	})
})
