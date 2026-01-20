import { describe, expect, it, jest } from '@jest/globals'
import type { Product } from '@tolo/common/api'

import { formatPrice, getProductBaseCost } from '../price'

// Mock the productQueryOptions to avoid dependency issues
jest.mock('~/lib/queries/product', () => ({
	productQueryOptions: jest.fn(() => ({ queryKey: ['product'] })),
}))

jest.mock('~/lib/query-client', () => ({
	queryClient: {
		getQueryData: jest.fn(),
	},
}))

describe('formatPrice', () => {
	it('should format cents to dollars, removing trailing zeros', () => {
		expect(formatPrice(250)).toBe('$2.5')
	})

	it('should format whole dollars without cents', () => {
		expect(formatPrice(300)).toBe('$3')
	})

	it('should format large amounts correctly', () => {
		expect(formatPrice(125_000)).toBe('$1,250')
	})

	it('should handle string input', () => {
		expect(formatPrice('450')).toBe('$4.5')
	})

	it('should handle zero', () => {
		expect(formatPrice(0)).toBe('$0')
	})

	it('should handle invalid input gracefully', () => {
		expect(formatPrice('invalid')).toBe('$0')
		expect(formatPrice(Number.NaN)).toBe('$0')
		expect(formatPrice(Number.POSITIVE_INFINITY)).toBe('$0')
	})

	it('should format prices with single cent', () => {
		expect(formatPrice(101)).toBe('$1.01')
	})

	it('should format very small amounts', () => {
		expect(formatPrice(1)).toBe('$0.01')
	})
})

describe('getProductBaseCost', () => {
	it('should return formatted cost from modifications when format is true', () => {
		const product: Product = {
			modifications: [
				{
					spots: [{ price: '500' }],
				},
			],
		} as Product

		const cost = getProductBaseCost(product, true)

		expect(cost).toBe('$5')
	})

	it('should return numeric cost from modifications when format is false', () => {
		const product: Product = {
			modifications: [
				{
					spots: [{ price: '500' }],
				},
			],
		} as Product

		const cost = getProductBaseCost(product, false)

		expect(cost).toBe(500)
	})

	it('should return formatted cost from price object when product has no modifications', () => {
		const product = {
			price: { small: '350' },
		} as unknown as Product

		const cost = getProductBaseCost(product)

		expect(cost).toBe('$3.5')
	})

	it('should handle null product gracefully', () => {
		const cost = getProductBaseCost(null)

		expect(cost).toBe('$0')
	})

	it('should handle product with empty price object', () => {
		const product: Product = {
			price: {},
		} as Product

		const cost = getProductBaseCost(product)

		expect(cost).toBe('$0')
	})

	it('should default to formatted when format parameter is not provided', () => {
		const product: Product = {
			price: { regular: '400' },
		} as unknown as Product

		const cost = getProductBaseCost(product)

		expect(typeof cost).toBe('string')
		expect(cost).toBe('$4')
	})
})
