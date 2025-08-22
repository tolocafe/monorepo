import type { ComponentProps, ReactNode } from 'react'
import { Platform, Pressable } from 'react-native'
import type { GestureResponderEvent, StyleProp, TextStyle } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/components/Text'

type ButtonVariant = 'primary' | 'surface' | 'transparent'

type Props = ComponentProps<typeof Pressable> & {
	accessibilityLabel?: string
	children: ReactNode
	disabled?: boolean
	fullWidth?: boolean
	onPress?: (event: GestureResponderEvent) => void
	testID?: string
	textStyle?: StyleProp<TextStyle>
	variant?: ButtonVariant
}

export function Button({
	children,
	disabled = false,
	fullWidth = false,
	textStyle,
	variant = 'primary',
	...props
}: Props) {
	const buttonState = disabled ? 'disabled' : undefined
	const buttonWidth = fullWidth ? 'fullWidth' : undefined

	styles.useVariants({
		state: buttonState,
		variant,
		width: buttonWidth,
	})

	return (
		<Pressable
			accessibilityRole="button"
			android_ripple={{ color: '#fff' }}
			disabled={disabled}
			style={({ pressed }) => [
				styles.button,
				pressed && !disabled && styles.buttonPressed,
			]}
			{...props}
		>
			<Text numberOfLines={1} style={[styles.text, textStyle]}>
				{children}
			</Text>
		</Pressable>
	)
}

const styles = StyleSheet.create((theme) => ({
	button: {
		alignItems: 'center',
		borderCurve: Platform.OS === 'ios' ? 'continuous' : undefined,
		borderRadius: theme.borderRadius.lg,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		variants: {
			state: {
				disabled: {
					opacity: 0.6,
				},
			},
			variant: {
				primary: {
					backgroundColor: theme.colors.primary,
				},
				surface: {
					backgroundColor: theme.colors.surface,
					borderColor: theme.colors.border,
					borderWidth: 1,
				},
				transparent: {
					backgroundColor: 'transparent',
				},
			},
			width: {
				fullWidth: {
					alignSelf: 'stretch',
					flex: 1,
				},
			},
		},
	},
	buttonPressed: {
		opacity: 0.85,
	},
	text: {
		textTransform: 'uppercase',
		...theme.typography.button,
		variants: {
			variant: {
				primary: {
					color: theme.colors.surface,
				},
				surface: {
					color: theme.colors.text,
				},
				transparent: {
					color: theme.colors.text,
				},
			},
		},
	},
}))
