import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

type Props = {
	accessibilityLabel?: string
	children: ReactNode
	padded?: boolean
	style?: StyleProp<ViewStyle>
	testID?: string
}

export function Card({
	accessibilityLabel,
	children,
	padded = true,
	style,
	testID,
}: Props) {
	const padding = padded ? 'padded' : undefined

	styles.useVariants({ padding })

	return (
		<View
			accessibilityLabel={accessibilityLabel}
			style={[styles.base, style]}
			testID={testID}
		>
			{children}
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	base: {
		backgroundColor: theme.colors.gray.background,
		borderCurve: 'continuous',
		borderRadius: theme.borderRadius.lg,
		variants: {
			padding: {
				padded: {
					padding: theme.spacing.md,
					paddingVertical: theme.spacing.xs,
				},
			},
		},
	},
}))
