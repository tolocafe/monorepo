import Ionicons from '@expo/vector-icons/Ionicons'
import type { ComponentProps, ReactNode } from 'react'
import { Platform, Pressable, View } from 'react-native'
import type { GestureResponderEvent, StyleProp, TextStyle } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/components/Text'

type Props = Omit<ComponentProps<typeof Pressable>, 'children'> & {
	checked?: boolean
	children: ReactNode
	disabled?: boolean
	onPress?: (event: GestureResponderEvent) => void
	right?: ReactNode
	rightTextStyle?: StyleProp<TextStyle>
	style?: ComponentProps<typeof Pressable>['style']
	textStyle?: StyleProp<TextStyle>
}

export function CheckedButton({
	accessibilityState,
	checked = false,
	children,
	disabled = false,
	onPress,
	right,
	rightTextStyle,
	style,
	textStyle,
	...props
}: Props) {
	// oxlint-disable-next-line no-undefined
	const buttonState = disabled ? 'disabled' : undefined
	const layoutVariant = right ? 'withRight' : 'center'

	styles.useVariants({ layout: layoutVariant, state: buttonState })

	return (
		<Pressable
			accessibilityState={{
				...accessibilityState,
				disabled,
				selected: checked,
			}}
			android_ripple={{ color: '#fff' }}
			disabled={disabled}
			onPress={onPress}
			style={(state) => [
				styles.button,
				state.pressed && !disabled && styles.buttonPressed,
				typeof style === 'function' ? style(state) : style,
			]}
			// oxlint-disable-next-line jsx-props-no-spreading
			{...props}
		>
			<View style={styles.content}>
				<View style={styles.left}>
					{checked ? (
						<View style={styles.check}>
							<Ionicons color="white" name="checkmark" size={16} />
						</View>
					) : null}
					<Text style={[styles.label, textStyle]}>{children}</Text>
				</View>

				{right ? (
					typeof right === 'string' || typeof right === 'number' ? (
						<Text style={[styles.rightText, rightTextStyle]}>{right}</Text>
					) : (
						right
					)
				) : null}
			</View>
		</Pressable>
	)
}

const styles = StyleSheet.create((theme) => ({
	button: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.border,
		borderColor: theme.colors.gray.interactive,
		borderCurve: Platform.select({ ios: 'continuous' }),
		borderRadius: theme.borderRadius.full,
		borderWidth: 1,
		justifyContent: 'center',
		minHeight: 44,
		minWidth: 44,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		variants: {
			state: {
				disabled: {
					opacity: 0.6,
				},
			},
		},
	},
	buttonPressed: {
		opacity: 0.85,
	},
	check: {
		alignItems: 'center',
		backgroundColor: theme.colors.verde.solid,
		borderRadius: theme.borderRadius.full,
		height: 20,
		justifyContent: 'center',
		width: 20,
	},
	content: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'center',
		variants: {
			layout: {
				center: {
					justifyContent: 'center',
				},
				withRight: {
					justifyContent: 'space-between',
				},
			},
		},
	},
	label: {
		fontSize: theme.typography.button.fontSize,
		fontWeight: theme.fontWeights.semibold,
	},
	left: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	rightText: {
		color: theme.colors.verde.text,
		fontSize: theme.typography.button.fontSize,
		fontWeight: theme.fontWeights.semibold,
	},
}))
