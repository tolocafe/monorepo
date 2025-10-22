import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react-native'

import { render } from '@/test-utils'

import { H1, H2, H3, H4, Label, Paragraph, Text } from '../Text'

describe('Text Components', () => {
	describe('Text', () => {
		it('should render text content', () => {
			render(<Text>Hello World</Text>)

			expect(screen.getByText('Hello World')).toBeTruthy()
		})

		it('should apply custom styles', () => {
			render(<Text style={{ fontSize: 20 }}>Styled Text</Text>)

			expect(screen.getByText('Styled Text')).toBeTruthy()
		})

		it('should handle align prop', () => {
			render(<Text align="center">Centered Text</Text>)

			expect(screen.getByText('Centered Text')).toBeTruthy()
		})

		it('should handle weight prop', () => {
			render(<Text weight="bold">Bold Text</Text>)

			expect(screen.getByText('Bold Text')).toBeTruthy()
		})
	})

	describe('H1', () => {
		it('should render heading text', () => {
			render(<H1>Main Heading</H1>)

			expect(screen.getByText('Main Heading')).toBeTruthy()
		})

		it('should have header accessibility role', () => {
			const { getByRole } = render(<H1>Accessible Heading</H1>)

			expect(getByRole('header')).toBeTruthy()
		})
	})

	describe('H2', () => {
		it('should render heading text', () => {
			render(<H2>Subheading</H2>)

			expect(screen.getByText('Subheading')).toBeTruthy()
		})

		it('should have header accessibility role', () => {
			const { getByRole } = render(<H2>Section Heading</H2>)

			expect(getByRole('header')).toBeTruthy()
		})
	})

	describe('H3', () => {
		it('should render heading text', () => {
			render(<H3>Third Level Heading</H3>)

			expect(screen.getByText('Third Level Heading')).toBeTruthy()
		})

		it('should have header accessibility role', () => {
			const { getByRole } = render(<H3>Subsection</H3>)

			expect(getByRole('header')).toBeTruthy()
		})
	})

	describe('H4', () => {
		it('should render heading text', () => {
			render(<H4>Fourth Level Heading</H4>)

			expect(screen.getByText('Fourth Level Heading')).toBeTruthy()
		})

		it('should have header accessibility role', () => {
			const { getByRole } = render(<H4>Minor Heading</H4>)

			expect(getByRole('header')).toBeTruthy()
		})
	})

	describe('Label', () => {
		it('should render label text', () => {
			render(<Label>Form Label</Label>)

			expect(screen.getByText('Form Label')).toBeTruthy()
		})

		it('should accept custom styles', () => {
			const { getByText } = render(
				<Label style={{ color: 'red' }}>Styled Label</Label>,
			)

			expect(getByText('Styled Label')).toBeTruthy()
		})
	})

	describe('Paragraph', () => {
		it('should render paragraph text', () => {
			render(<Paragraph>This is a paragraph of text.</Paragraph>)

			expect(screen.getByText('This is a paragraph of text.')).toBeTruthy()
		})

		it('should accept custom styles', () => {
			const { getByText } = render(
				<Paragraph style={{ marginBottom: 16 }}>Styled Paragraph</Paragraph>,
			)

			expect(getByText('Styled Paragraph')).toBeTruthy()
		})
	})
})
