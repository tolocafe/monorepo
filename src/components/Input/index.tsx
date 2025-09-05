import type { ComponentProps } from 'react'
import { TextInput as RNTextInput } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

export type InputProps = ComponentProps<typeof RNTextInput> & {
	borderless?: boolean
	error?: boolean
}

export function Input({
	borderless,
	error = false,
	style,
	...rest
}: InputProps) {
	styles.useVariants({ borderless })

	return (
		<RNTextInput
			placeholderTextColor={styles.placeholder.color}
			{...rest}
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
		_web: {
			_placeholder: {
				color: theme.colors.gray.interactive,
			},
		},
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		color: theme.colors.gray.text,
		fontSize: theme.fontSizes.md,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		variants: {
			borderless: {
				true: {
					borderRadius: theme.borderRadius.sm,
					borderWidth: 0,
				},
			},
		},
	},
	error: {
		borderColor: theme.colors.rojo.solid,
	},
	multiline: {
		minHeight: 80,
		paddingVertical: theme.spacing.md,
		textAlignVertical: 'top',
	},
	placeholder: {
		color: theme.colors.crema.solid,
	},
}))

export default Input
