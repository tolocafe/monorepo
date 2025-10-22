import { describe, expect, it } from '@jest/globals'

import { getProductBaseCost, getProductTotalCost } from '../utils'

import type { Product } from '../api'

describe('getProductBaseCost', () => {
	it('should return cost from modifications when product has modifications', () => {
		const product: Product = {
			modifications: [
				{
					spots: [{ price: '500' }],
				},
			],
		} as Product

		const cost = getProductBaseCost(product)

		expect(cost).toBe(500)
	})

	it('should return cost from price object when product has no modifications', () => {
		const product = {
			price: { large: '450', small: '350' },
		} as unknown as Product

		const cost = getProductBaseCost(product)

		expect(cost).toBe(450)
	})

	it('should return NaN when product has no price or modifications', () => {
		const product = {} as unknown as Product

		const cost = getProductBaseCost(product)

		expect(Number.isNaN(cost)).toBe(true)
	})
})

describe('getProductTotalCost', () => {
	it('should calculate total cost for a product without modifications', () => {
		const product = {
			group_modifications: [],
			price: { regular: '400' },
		} as unknown as Product

		const totalCost = getProductTotalCost({
			modifications: {},
			product,
			quantity: 2,
		})

		expect(totalCost).toBe(800)
	})

	it('should calculate total cost for a product with modifications', () => {
		const product = {
			group_modifications: [
				{
					modifications: [
						{
							dish_modification_id: 1,
							price: 50,
						},
						{
							dish_modification_id: 2,
							price: 100,
						},
					],
				},
			],
			price: { regular: '400' },
		} as unknown as Product

		const totalCost = getProductTotalCost({
			modifications: { '1': 1, '2': 1 },
			product,
			quantity: 1,
		})

		// Base: 400 + (50 * 100) + (100 * 100) = 400 + 5000 + 10000 = 15400
		expect(totalCost).toBe(15_400)
	})

	it('should multiply by quantity correctly', () => {
		const product = {
			group_modifications: [],
			price: { regular: '300' },
		} as unknown as Product

		const totalCost = getProductTotalCost({
			modifications: {},
			product,
			quantity: 5,
		})

		expect(totalCost).toBe(1500)
	})

	it('should handle missing modification gracefully', () => {
		const product = {
			group_modifications: [
				{
					modifications: [
						{
							dish_modification_id: 1,
							price: 50,
						},
					],
				},
			],
			price: { regular: '400' },
		} as unknown as Product

		const totalCost = getProductTotalCost({
			modifications: { '999': 1 }, // Non-existent modification
			product,
			quantity: 1,
		})

		expect(totalCost).toBe(400)
	})
})
