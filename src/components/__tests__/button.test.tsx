import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react-native'

import { render } from '@/test-utils'

import Button from '../Button'

const noop = () => null

describe('Button', () => {
	it('should render button with text', () => {
		render(<Button onPress={noop}>Click Me</Button>)

		expect(screen.getByText('Click Me')).toBeTruthy()
	})

	it('should call onPress when pressed', () => {
		const onPress = jest.fn()

		render(<Button onPress={onPress}>Press Button</Button>)

		fireEvent.press(screen.getByText('Press Button'))

		expect(onPress).toHaveBeenCalledTimes(1)
	})

	it('should not call onPress when disabled', () => {
		const onPress = jest.fn()

		render(
			<Button disabled onPress={onPress}>
				Disabled Button
			</Button>,
		)

		fireEvent.press(screen.getByText('Disabled Button'))

		expect(onPress).not.toHaveBeenCalled()
	})

	it('should have button accessibility role', () => {
		const { getByRole } = render(
			<Button onPress={noop}>Accessible Button</Button>,
		)

		expect(getByRole('button')).toBeTruthy()
	})

	it('should apply custom accessibility label', () => {
		const { getByLabelText } = render(
			<Button accessibilityLabel="Custom Label" onPress={noop}>
				Button
			</Button>,
		)

		expect(getByLabelText('Custom Label')).toBeTruthy()
	})

	it('should support testID prop', () => {
		const { getByTestId } = render(
			<Button onPress={noop} testID="test-button">
				Test Button
			</Button>,
		)

		expect(getByTestId('test-button')).toBeTruthy()
	})

	it('should render primary variant by default', () => {
		render(<Button onPress={noop}>Primary</Button>)

		expect(screen.getByText('Primary')).toBeTruthy()
	})

	it('should render surface variant', () => {
		render(
			<Button onPress={noop} variant="surface">
				Surface
			</Button>,
		)

		expect(screen.getByText('Surface')).toBeTruthy()
	})

	it('should render transparent variant', () => {
		render(
			<Button onPress={noop} variant="transparent">
				Transparent
			</Button>,
		)

		expect(screen.getByText('Transparent')).toBeTruthy()
	})

	it('should render asChild content', () => {
		render(
			<Button asChild onPress={noop}>
				<Button.Text>Custom Child</Button.Text>
			</Button>,
		)

		expect(screen.getByText('Custom Child')).toBeTruthy()
	})

	it('should render button with long text', () => {
		render(
			<Button onPress={noop}>
				This is a very long button text that should be truncated
			</Button>,
		)

		expect(
			screen.getByText(
				'This is a very long button text that should be truncated',
			),
		).toBeTruthy()
	})
})

describe('Button.Text', () => {
	it('should render button text', () => {
		render(<Button.Text>Button Text</Button.Text>)

		expect(screen.getByText('Button Text')).toBeTruthy()
	})

	it('should apply variant styles', () => {
		render(<Button.Text variant="surface">Surface Text</Button.Text>)

		expect(screen.getByText('Surface Text')).toBeTruthy()
	})

	it('should accept custom styles', () => {
		const { getByText } = render(
			<Button.Text style={{ fontSize: 18 }}>Styled Text</Button.Text>,
		)

		expect(getByText('Styled Text')).toBeTruthy()
	})
})
