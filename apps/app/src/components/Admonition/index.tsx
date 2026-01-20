import { Ionicons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { Text } from '@/components/Text'

type AdmonitionVariant = 'info' | 'tip' | 'warning'

type Props = {
	children: ReactNode
	title?: ReactNode
	variant?: AdmonitionVariant
}

const InfoIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.solid,
}))

const TipIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.primary.solid,
}))

const WarningIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.amarillo.solid,
}))

const variantConfig = {
	info: { Icon: InfoIcon, name: 'information-circle-outline' },
	tip: { Icon: TipIcon, name: 'bulb-outline' },
	warning: { Icon: WarningIcon, name: 'warning-outline' },
} as const

export default function Admonition({
	children,
	title,
	variant = 'info',
}: Props) {
	styles.useVariants({ variant })

	const { Icon, name } = variantConfig[variant]

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Icon name={name} size={18} />
				{title && <Text style={styles.title}>{title}</Text>}
			</View>
			<Text style={styles.content}>{children}</Text>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		borderLeftWidth: 4,
		borderRadius: theme.borderRadius.md,
		gap: theme.spacing.xs,
		padding: theme.spacing.md,
		variants: {
			variant: {
				info: {
					backgroundColor: theme.colors.gray.border,
					borderLeftColor: theme.colors.gray.solid,
				},
				tip: {
					backgroundColor: theme.colors.primary.background,
					borderLeftColor: theme.colors.primary.solid,
				},
				warning: {
					backgroundColor: theme.colors.amarillo.background,
					borderLeftColor: theme.colors.amarillo.solid,
				},
			},
		},
	},
	content: {
		fontSize: theme.fontSizes.sm,
		lineHeight: theme.fontSizes.sm * 1.5,
		variants: {
			variant: {
				info: {
					color: theme.colors.gray.text,
				},
				tip: {
					color: theme.colors.primary.text,
				},
				warning: {
					color: theme.colors.amarillo.text,
				},
			},
		},
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.xs,
	},
	title: {
		fontWeight: '700',
		textTransform: 'uppercase',
		variants: {
			variant: {
				info: {
					color: theme.colors.gray.solid,
				},
				tip: {
					color: theme.colors.primary.solid,
				},
				warning: {
					color: theme.colors.amarillo.solid,
				},
			},
		},
	},
}))
