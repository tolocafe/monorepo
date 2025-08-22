import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Platform, View } from 'react-native'

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
		backgroundColor: theme.colors.surface,
		borderCurve: Platform.OS === 'ios' ? 'continuous' : undefined,
		borderRadius: theme.borderRadius.lg,
		boxShadow: '0px 0px 12px 0px rgba(0, 0, 0, 0.04)',
		variants: {
			padding: {
				padded: {
					padding: theme.spacing.lg,
				},
			},
		},
	},
}))
