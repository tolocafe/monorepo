import type { ComponentProps, ReactNode } from 'react'
import { Platform, Pressable } from 'react-native'
import type { GestureResponderEvent, StyleProp, TextStyle } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/components/Text'

type ButtonVariant = 'primary' | 'surface' | 'transparent'

type Props = ComponentProps<typeof Pressable> & {
	accessibilityLabel?: string
	asChild?: boolean
	children: ReactNode
	disabled?: boolean | undefined
	fullWidth?: boolean
	onPress?: (event: GestureResponderEvent) => void
	testID?: string
	textStyle?: StyleProp<TextStyle>
	variant?: ButtonVariant
}

function ButtonText({
	children,
	style,
	variant,
}: ComponentProps<typeof Text> & { variant?: ButtonVariant }) {
	styles.useVariants({ variant })

	return <Text style={[styles.text, style]}>{children}</Text>
}

const androidRipple = { color: '#fff' }

function Button({
	asChild = false,
	children,
	disabled = false,
	fullWidth = false,
	style,
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
			android_ripple={androidRipple}
			disabled={disabled}
			style={(state) => [
				styles.button,
				state.pressed && !disabled && styles.buttonPressed,
				typeof style === 'function' ? style(state) : style,
			]}
			{...props}
		>
			{asChild ? (
				children
			) : (
				<ButtonText numberOfLines={1} variant={variant}>
					{children}
				</ButtonText>
			)}
		</Pressable>
	)
}

Button.Text = ButtonText

export { Button }

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
					backgroundColor: theme.colors.verde.solid,
				},
				surface: {
					backgroundColor: theme.colors.gray.background,
					borderColor: theme.colors.gray.border,
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
		...theme.typography.button,
		textTransform: 'uppercase',
		variants: {
			variant: {
				primary: {
					color: theme.colors.gray.background,
				},
				surface: {
					color: theme.colors.gray.text,
				},
				transparent: {
					color: theme.colors.gray.text,
				},
			},
		},
	},
}))
