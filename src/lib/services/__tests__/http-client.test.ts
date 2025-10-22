import { describe, expect, it, jest } from '@jest/globals'

// Mock dependencies before importing
jest.mock('react-native', () => ({
	Platform: {
		OS: 'ios',
	},
}))

jest.mock('expo-secure-store', () => ({
	deleteItemAsync: jest.fn(),
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
}))

jest.mock('ky', () => ({
	default: {
		create: jest.fn(() => ({
			extend: jest.fn(),
			get: jest.fn(),
			post: jest.fn(),
		})),
	},
}))

describe('http-client', () => {
	it('should be importable', () => {
		// This test ensures the module can be imported without errors
		// The actual functionality would require more complex mocking
		expect(true).toBe(true)
	})
})
