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
	disabled?: boolean
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
	style,
	textStyle: _textStyle,
	variant = 'primary',
	...props
}: Props) {
	const buttonState = disabled ? 'disabled' : undefined

	styles.useVariants({
		state: buttonState,
		variant,
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
			// oxlint-disable-next-line jsx-props-no-spreading
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

export default Object.assign(Button, { Text: ButtonText })

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
					_web: {
						_hover: {
							backgroundColor: theme.colors.primary.text,
						},
					},
					backgroundColor: theme.colors.primary.solid,
				},
				surface: {
					_web: {
						_hover: {
							backgroundColor: theme.colors.gray.border,
						},
					},
					backgroundColor: theme.colors.gray.background,
					borderColor: theme.colors.gray.border,
					borderWidth: 1,
				},
				transparent: {
					_web: {
						_hover: {
							backgroundColor: 'rgba(0,0,0,0.1)',
						},
					},
					backgroundColor: 'transparent',
					paddingVertical: theme.spacing.sm,
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
					color: 'white',
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
