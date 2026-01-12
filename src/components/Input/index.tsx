import { useCallback } from 'react'
import type { ComponentProps } from 'react'
import { TextInput as RNTextInput } from 'react-native'
import { MaskedTextInput } from 'react-native-mask-text'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

export type InputProps = ComponentProps<typeof RNTextInput> & {
	borderless?: boolean
	error?: boolean
	mask?: string
}

const UniMaskedTextInput = withUnistyles(MaskedTextInput, (theme) => ({
	placeholderTextColor: theme.colors.gray.interactive,
	style: {
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		color: theme.colors.gray.text,
		fontSize: theme.fontSizes.md,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
	},
}))

const GrayRNTextInput = withUnistyles(RNTextInput, (theme) => ({
	placeholderTextColor: theme.colors.gray.solid,
}))

export function Input({
	borderless,
	error = false,
	mask,
	style,
	...rest
}: InputProps) {
	styles.useVariants({
		borderless,
		hasError: error,
		isMultiline: rest.multiline,
	})

	const handleMaskTextChange = useCallback((_text: string, rawText: string) => {
		rest.onChangeText?.(rawText)
		// eslint-disable-next-line react-compiler/react-compiler
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (mask) {
		return (
			<UniMaskedTextInput
				mask={mask}
				// oxlint-disable-next-line jsx-props-no-spreading
				{...rest}
				onChangeText={handleMaskTextChange}
			/>
		)
	}

	// oxlint-disable-next-line jsx-props-no-spreading
	return <GrayRNTextInput {...rest} style={[styles.base, style]} />
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
			hasError: {
				true: {
					borderColor: theme.colors.rojo.solid,
				},
			},
			isMultiline: {
				true: {
					minHeight: 80,
					paddingVertical: theme.spacing.md,
					textAlignVertical: 'top',
				},
			},
		},
	},
}))

export default Input
