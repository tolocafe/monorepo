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
// Unistyles requires native modules that aren't available in Jest test environment
jest.mock('react-native-unistyles', () => ({
	StyleSheet: {
		configure: jest.fn(),
		create: jest.fn((styles) => {
			// Return a mock stylesheet with useVariants method
			const mockStyles = Object.keys(styles).reduce(
				(accumulator, key) => {
					accumulator[key] = styles[key]
					return accumulator
				},
				{ useVariants: jest.fn() },
			)
			return mockStyles
		}),
	},
	UnistylesRegistry: {
		addConfig: jest.fn(),
		addThemes: jest.fn(),
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
}))

jest.mock('@lingui/react/macro', () => ({
	Trans: ({ children }) => children,
	useLingui: () => ({
		t: (template) => template.join(''),
	}),
}))

// Mock @bottom-tabs/react-navigation
jest.mock('@bottom-tabs/react-navigation', () => ({
	createNativeBottomTabNavigator: () => ({
		Navigator: 'Navigator',
		Screen: 'Screen',
	}),
}))

// Mock Zustand
jest.mock('zustand', () => ({
	// eslint-disable-next-line unicorn/consistent-function-scoping
	create: jest.fn(() => () => null),
}))
