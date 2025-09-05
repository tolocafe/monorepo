import type { ComponentProps } from 'react'
import { useCallback } from 'react'
import { TextInput as RNTextInput } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

export type DateInputProps = Omit<
	ComponentProps<typeof RNTextInput>,
	'onChangeText' | 'value'
> & {
	/** If true, shows input in read-only style but still allows editing */
	disabled?: boolean
	error?: boolean
	/** Called with DD/MM/YYYY format for display, YYYY-MM-DD for storage */
	onChangeText: (displayValue: string, storageValue: string) => void
	/** Value in YYYY-MM-DD format */
	value: string
}

/**
 * DateInput component with automatic slash insertion for DD/MM/YYYY format.
 * Converts between display format (DD/MM/YYYY) and storage format (YYYY-MM-DD).
 */
export function DateInput({
	disabled = false,
	error = false,
	onChangeText,
	style,
	value,
	...rest
}: DateInputProps) {
	// Convert YYYY-MM-DD to DD/MM/YYYY for display
	const displayValue = convertToDisplayFormat(value)

	const handleTextChange = useCallback(
		(text: string) => {
					// Remove all non-digits
		const digitsOnly = text.replaceAll(/\D/g, '')

			// Format with automatic slash insertion
			let formatted = ''
			if (digitsOnly.length > 0) {
							// DD
			formatted = digitsOnly.slice(0, 2)
			if (digitsOnly.length > 2) {
				// DD/MM
				formatted += '/' + digitsOnly.slice(2, 4)
				if (digitsOnly.length > 4) {
					// DD/MM/YYYY
					formatted += '/' + digitsOnly.slice(4, 8)
				}
			}
			}

			// Convert to storage format (YYYY-MM-DD)
			const storageValue = convertToStorageFormat(formatted)

			onChangeText(formatted, storageValue)
		},
		[onChangeText],
	)

	return (
		<RNTextInput
			editable={!disabled}
			keyboardType="numeric"
			maxLength={10}
			onChangeText={handleTextChange}
			placeholderTextColor={styles.placeholder.color}
			style={[
				styles.base,
				error && styles.error,
				disabled && styles.disabled,
				rest.multiline && styles.multiline,
				style,
			]}
			value={displayValue}
			{...rest}
		/>
	)
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY for display
 */
function convertToDisplayFormat(value: string): string {
	if (!value) return ''

	// Handle YYYY-MM-DD format
	const yearMonthDayRegex = /^(\d{4})-(\d{2})-(\d{2})$/
	const match = yearMonthDayRegex.exec(value)
	if (match) {
		const [, year, month, day] = match
		return `${day}/${month}/${year}`
	}

	// If it's already in DD/MM/YYYY format or partial, return as is
	return value
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for storage
 */
function convertToStorageFormat(displayValue: string): string {
	if (!displayValue) return ''

	// Handle DD/MM/YYYY format
	const dayMonthYearRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
	const match = dayMonthYearRegex.exec(displayValue)
	if (match) {
		const [, day, month, year] = match
		return `${year}-${month}-${day}`
	}

	// Return empty string for incomplete dates
	return ''
}

const styles = StyleSheet.create((theme) => ({
	base: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		color: theme.colors.text,
		fontSize: theme.fontSizes.md,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
	},
	disabled: {
		backgroundColor: theme.colors.background,
		color: theme.colors.textSecondary,
	},
	error: {
		borderColor: theme.colors.error,
	},
	multiline: {
		minHeight: 80,
		paddingVertical: theme.spacing.md,
		textAlignVertical: 'top',
	},
	placeholder: {
		color: theme.colors.textSecondary,
	},
}))

export default DateInput
