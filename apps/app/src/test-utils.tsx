import { render } from '@testing-library/react-native'
import type { RenderOptions } from '@testing-library/react-native'
import type { ReactElement } from 'react'

import './lib/styles/unistyles'

/**
 * Custom render function that wraps components with necessary providers for testing.
 *
 * This follows the recommended pattern from React Native Testing Library:
 * @see https://testing-library.com/docs/react-native-testing-library/setup
 *
 * Note: Unistyles is mocked in jest.setup.js since it requires native modules
 * that aren't available in the Jest test environment.
 */
function customRender(
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>,
) {
	return render(ui, { ...options })
}

// Re-export everything from React Native Testing Library
export * from '@testing-library/react-native'

// Override render method with our custom render
export { customRender as render }
