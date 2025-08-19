import type { ReactNode } from 'react'
import { Platform, Pressable, View } from 'react-native'
import type { GestureResponderEvent } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/components/Text'

export type ButtonProps = {
	accessibilityLabel?: string
	children: ReactNode
	disabled?: boolean
	fullWidth?: boolean
	onPress?: (event: GestureResponderEvent) => void
	testID?: string
	variant?: ButtonVariant
}

type ButtonVariant = 'primary' | 'surface' | 'transparent'

export function Button({
	accessibilityLabel,
	children,
	disabled = false,
	fullWidth = false,
	onPress,
	testID,
	variant = 'primary',
}: ButtonProps) {
	const isPrimary = variant === 'primary'

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				isPrimary ? styles.buttonPrimary : styles.buttonSurface,
				disabled && styles.buttonDisabled,
				pressed && !disabled && styles.buttonPressed,
				fullWidth && styles.fullWidth,
			]}
			testID={testID}
		>
			<View style={styles.contentWrapper}>
				<Text
					numberOfLines={1}
					style={[
						styles.text,
						isPrimary ? styles.textOnPrimary : styles.textOnSurface,
					]}
				>
					{children}
				</Text>
			</View>
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
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonPressed: {
		opacity: 0.85,
	},
	buttonPrimary: {
		backgroundColor: theme.colors.primary,
	},
	buttonSurface: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderWidth: 1,
	},
	contentWrapper: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.xs,
		justifyContent: 'center',
	},
	fullWidth: {
		alignSelf: 'stretch',
		flex: 1,
	},
	text: {
		textTransform: 'uppercase',
		...theme.typography.button,
	},
	textOnPrimary: {
		color: theme.colors.surface,
	},
	textOnSurface: {
		color: theme.colors.text,
	},
}))
