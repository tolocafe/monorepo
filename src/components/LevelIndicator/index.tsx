import { View } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/components/Text'

const MAX_DOTS = 5
const DOT_SIZE = 16

type LevelIndicatorProps = {
	label: string
	level?: number
}

function Dot({ filled }: { filled: boolean }) {
	styles.useVariants({ filled })

	return <View style={styles.dot} />
}

export function LevelIndicator({ label, level }: LevelIndicatorProps) {
	if (level === undefined || level === 0) {
		return null
	}

	return (
		<View style={styles.container}>
			<View style={styles.dots}>
				{Array.from({ length: MAX_DOTS }, (_, index) => (
					<Dot key={index} filled={index < level} />
				))}
			</View>
			<Text style={styles.label}>{label}</Text>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		gap: theme.spacing.xs,
	},
	dot: {
		backgroundColor: 'transparent',
		borderRadius: theme.borderRadius.full,
		borderWidth: 1,
		borderColor: theme.colors.gray.solid,
		height: DOT_SIZE,
		width: DOT_SIZE,
		variants: {
			filled: {
				true: {
					borderColor: theme.colors.naranja.solid,
					backgroundColor: theme.colors.naranja.solid,
				},
			},
		},
	},
	dots: {
		flexDirection: 'row',
		gap: theme.spacing.xs,
	},
	label: {
		color: theme.colors.gray.text,
		fontWeight: theme.fontWeights.medium,
	},
}))
