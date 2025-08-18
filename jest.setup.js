import '@testing-library/jest-native/extend-expect'
import { jest } from '@jest/globals'

// Additional mocks for libraries not covered by jest-expo

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
	MMKV: jest.fn(() => ({
		delete: jest.fn(),
		getString: jest.fn(),
		set: jest.fn(),
	})),
}))

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
	captureException: jest.fn(),
	captureMessage: jest.fn(),
	reactNavigationIntegration: jest.fn(() => ({
		registerNavigationContainer: jest.fn(),
	})),
	wrap: jest.fn((component) => component),
}))

// Mock react-native-unistyles
jest.mock('react-native-unistyles', () => ({
	StyleSheet: {
		configure: jest.fn(),
		create: jest.fn(() => ({})),
	},
}))

// Mock Lingui
jest.mock('@lingui/core', () => ({
	i18n: {
		activate: jest.fn(),
		load: jest.fn(),
	},
}))

jest.mock('@lingui/react', () => ({
	I18nProvider: ({ children }) => children,
	useLingui: () => ({ t: (arrOrStr) => (Array.isArray(arrOrStr) ? arrOrStr.join('') : String(arrOrStr)) }),
}))

jest.mock('@lingui/react/macro', () => ({
	Trans: ({ children }) => children,
}))

// Mock @bottom-tabs/react-navigation
jest.mock('@bottom-tabs/react-navigation', () => ({
	createNativeBottomTabNavigator: () => ({
		Navigator: 'Navigator',
		Screen: 'Screen',
	}),
}))

// Mock native modules that are not available in Jest environment
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: ({ children }) => children,
}))

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}))

// Ensure api.menu getters exist to prevent crashes when store imports menu queries
jest.mock('@/lib/services/api-service', () => ({
  api: {
    auth: { self: jest.fn() },
    client: { update: jest.fn() },
    menu: { getCategories: jest.fn(async () => []), getProducts: jest.fn(async () => []), getProduct: jest.fn() },
    orders: { create: jest.fn() },
  },
}))
