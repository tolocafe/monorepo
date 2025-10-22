import { describe, expect, it } from '@jest/globals'

import {
	CreateEWallettransactionSchema,
	CreateOrderProductSchema,
	CreateOrderSchema,
	CreateStripeTransactionSchema,
	PhoneSchema,
	RequestOtpSchema,
	VerifyOtpSchema,
} from '../schemas'

describe('PhoneSchema', () => {
	it('should accept valid phone number with plus sign', () => {
		const result = PhoneSchema.safeParse('+15551234567')

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('+15551234567')
		}
	})

	it('should add plus sign to phone number without it', () => {
		const result = PhoneSchema.safeParse('15551234567')

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('+15551234567')
		}
	})

	it('should trim whitespace from phone number', () => {
		const result = PhoneSchema.safeParse('  +15551234567  ')

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('+15551234567')
		}
	})

	it('should reject phone number that is too short', () => {
		const result = PhoneSchema.safeParse('+123456')

		expect(result.success).toBe(false)
	})

	it('should reject phone number that is too long', () => {
		const result = PhoneSchema.safeParse('+1234567890123456')

		expect(result.success).toBe(false)
	})

	it('should reject phone number with letters', () => {
		const result = PhoneSchema.safeParse('+1555ABC1234')

		expect(result.success).toBe(false)
	})
})

describe('RequestOtpSchema', () => {
	it('should accept valid request with only phone', () => {
		const result = RequestOtpSchema.safeParse({
			phone: '+15551234567',
		})

		expect(result.success).toBe(true)
	})

	it('should accept valid request with all fields', () => {
		const result = RequestOtpSchema.safeParse({
			birthdate: '1990-01-01',
			email: 'test@example.com',
			name: 'John Doe',
			phone: '+15551234567',
		})

		expect(result.success).toBe(true)
	})

	it('should reject invalid email', () => {
		const result = RequestOtpSchema.safeParse({
			email: 'invalid-email',
			phone: '+15551234567',
		})

		expect(result.success).toBe(false)
	})

	it('should reject name that is too long', () => {
		const result = RequestOtpSchema.safeParse({
			name: 'a'.repeat(101),
			phone: '+15551234567',
		})

		expect(result.success).toBe(false)
	})

	it('should reject missing phone', () => {
		const result = RequestOtpSchema.safeParse({
			name: 'John Doe',
		})

		expect(result.success).toBe(false)
	})
})

describe('VerifyOtpSchema', () => {
	it('should accept valid verification request', () => {
		const result = VerifyOtpSchema.safeParse({
			code: '123456',
			phone: '+15551234567',
			sessionName: 'my-session',
		})

		expect(result.success).toBe(true)
	})

	it('should reject code that is not 6 digits', () => {
		const result = VerifyOtpSchema.safeParse({
			code: '12345',
			phone: '+15551234567',
			sessionName: 'my-session',
		})

		expect(result.success).toBe(false)
	})

	it('should reject empty sessionName', () => {
		const result = VerifyOtpSchema.safeParse({
			code: '123456',
			phone: '+15551234567',
			sessionName: '',
		})

		expect(result.success).toBe(false)
	})
})

describe('CreateOrderProductSchema', () => {
	it('should accept valid product', () => {
		const result = CreateOrderProductSchema.safeParse({
			count: 2,
			product_id: 'product-123',
		})

		expect(result.success).toBe(true)
	})

	it('should accept product with modifications', () => {
		const result = CreateOrderProductSchema.safeParse({
			count: 1,
			modification: [{ a: 2, m: 'mod-1' }],
			product_id: 'product-123',
		})

		expect(result.success).toBe(true)
	})

	it('should reject count greater than 10', () => {
		const result = CreateOrderProductSchema.safeParse({
			count: 11,
			product_id: 'product-123',
		})

		expect(result.success).toBe(false)
	})

	it('should reject negative count', () => {
		const result = CreateOrderProductSchema.safeParse({
			count: -1,
			product_id: 'product-123',
		})

		expect(result.success).toBe(false)
	})

	it('should reject empty product_id', () => {
		const result = CreateOrderProductSchema.safeParse({
			count: 1,
			product_id: '',
		})

		expect(result.success).toBe(false)
	})
})

describe('CreateOrderSchema', () => {
	it('should accept valid order', () => {
		const result = CreateOrderSchema.safeParse({
			client_id: 123,
			comment: 'Please add extra sugar',
			payment: {
				amount: 1000,
			},
			products: [
				{
					count: 2,
					product_id: 'product-1',
				},
			],
			serviceMode: 1,
		})

		expect(result.success).toBe(true)
	})

	it('should reject empty products array', () => {
		const result = CreateOrderSchema.safeParse({
			client_id: 123,
			comment: '',
			payment: {
				amount: 1000,
			},
			products: [],
			serviceMode: 1,
		})

		expect(result.success).toBe(false)
	})

	it('should reject comment that is too long', () => {
		const result = CreateOrderSchema.safeParse({
			client_id: 123,
			comment: 'a'.repeat(2001),
			payment: {
				amount: 1000,
			},
			products: [
				{
					count: 1,
					product_id: 'product-1',
				},
			],
			serviceMode: 1,
		})

		expect(result.success).toBe(false)
	})

	it('should reject payment amount less than 100', () => {
		const result = CreateOrderSchema.safeParse({
			client_id: 123,
			comment: '',
			payment: {
				amount: 50,
			},
			products: [
				{
					count: 1,
					product_id: 'product-1',
				},
			],
			serviceMode: 1,
		})

		expect(result.success).toBe(false)
	})

	it('should reject invalid serviceMode', () => {
		const result = CreateOrderSchema.safeParse({
			client_id: 123,
			comment: '',
			payment: {
				amount: 1000,
			},
			products: [
				{
					count: 1,
					product_id: 'product-1',
				},
			],
			serviceMode: 5,
		})

		expect(result.success).toBe(false)
	})
})

describe('CreateEWallettransactionSchema', () => {
	it('should accept valid transaction', () => {
		const result = CreateEWallettransactionSchema.safeParse({
			amount: 5000,
		})

		expect(result.success).toBe(true)
	})

	it('should reject negative amount', () => {
		const result = CreateEWallettransactionSchema.safeParse({
			amount: -100,
		})

		expect(result.success).toBe(false)
	})

	it('should reject zero amount', () => {
		const result = CreateEWallettransactionSchema.safeParse({
			amount: 0,
		})

		expect(result.success).toBe(false)
	})
})

describe('CreateStripeTransactionSchema', () => {
	it('should accept valid transaction', () => {
		const result = CreateStripeTransactionSchema.safeParse({
			amount: 2500,
		})

		expect(result.success).toBe(true)
	})

	it('should reject negative amount', () => {
		const result = CreateStripeTransactionSchema.safeParse({
			amount: -500,
		})

		expect(result.success).toBe(false)
	})
})
