import type { ComponentProps } from 'react'
import { TextInput as RNTextInput } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

import { filterDigitsOnly } from '@/lib/utils/text-input'

export type InputProps = ComponentProps<typeof RNTextInput> & {
	error?: boolean
	/** Filter input to digits only (0-9) */
	numericOnly?: boolean
}

export function Input({
	error = false,
	numericOnly = false,
	onChangeText,
	style,
	...rest
}: InputProps) {
	const handleTextChange = (text: string) => {
		const processedText = numericOnly ? filterDigitsOnly(text) : text
		onChangeText?.(processedText)
	}

	return (
		<RNTextInput
			placeholderTextColor={styles.placeholder.color}
			{...rest}
			keyboardType={numericOnly ? 'numeric' : rest.keyboardType}
			onChangeText={handleTextChange}
			style={[
				styles.base,
				error && styles.error,
				rest.multiline && styles.multiline,
				style,
			]}
		/>
	)
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

export default Input
