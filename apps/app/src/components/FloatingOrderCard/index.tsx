import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Platform, Pressable, View } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { Text } from '@/components/Text'
import { ORDER_BUTTON_HEIGHT } from '@/lib/constants/ui'
import { transactionQueryOptions } from '@/lib/queries/order'
import type { OrderProduct } from '@/lib/stores/order-store'

const TAB_BAR_HEIGHT = Platform.select({
	android: 80,
	default: 49,
	web: 0,
})

function handlePress() {
	router.navigate('/orders/current', { withAnchor: true })
}

const ChevronIcon = withUnistyles(Ionicons, (theme) => ({
	color: Platform.OS === 'ios' ? theme.colors.gray.text : 'white',
	name: 'chevron-forward' as const,
	size: 20,
}))

export function FloatingOrderCard({
	products,
	transactionId,
}: {
	products: OrderProduct[]
	transactionId: null | string
}) {
	const { data: transaction } = useQuery(transactionQueryOptions(transactionId))

	const itemsCount = products.reduce((total, item) => total + item.quantity, 0)

	// Show if there are products or an active transaction
	if (products.length === 0 && !transactionId) {
		return null
	}

	const tableId = transaction?.table_id

	return (
		<View style={styles.container}>
			<Pressable
				accessibilityLabel={`Current order with ${itemsCount} items. Tap to view.`}
				accessibilityRole="button"
				onPress={handlePress}
				style={styles.buttonContainer}
			>
				<View style={styles.content}>
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{itemsCount}</Text>
					</View>
					<View style={styles.textContainer}>
						<Text style={styles.title} weight="bold">
							<Trans>Complete Order</Trans>
						</Text>
						<Text style={styles.subtitle}>
							{tableId ? (
								<Trans>Take-in - Table {tableId}</Trans>
							) : (
								<Trans>To-Go</Trans>
							)}
						</Text>
					</View>
				</View>
				<ChevronIcon />
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	badge: {
		alignItems: 'center',
		backgroundColor:
			Platform.OS === 'ios' ? theme.colors.primary.solid : 'white',
		borderRadius: theme.borderRadius.full,
		height: 32,
		justifyContent: 'center',
		minWidth: 32,
		paddingHorizontal: 8,
	},
	badgeText: {
		color: Platform.OS === 'ios' ? 'white' : theme.colors.primary.solid,
		fontSize: theme.fontSizes.lg,
		fontWeight: theme.fontWeights.bold,
	},
	buttonContainer: {
		_web: {
			padding: theme.spacing.sm,
		},
		alignItems: 'center',
		backgroundColor:
			Platform.OS === 'ios' ? 'transparent' : theme.colors.primary.solid,
		borderCurve: 'continuous',
		borderRadius: Platform.select({
			android: 0,
			default: theme.borderRadius.full,
		}),
		flex: 1,
		flexDirection: 'row',
		gap: theme.spacing.md,
		height: ORDER_BUTTON_HEIGHT,
		padding: theme.spacing.md,
	},
	container: {
		_web: {
			bottom: 50,
			marginHorizontal: 'auto',
			maxWidth: 325,
			width: '100%',
		},
		bottom: Platform.OS === 'ios' ? 0 : TAB_BAR_HEIGHT + runtime.insets.bottom,
		flex: Platform.OS === 'ios' ? 1 : undefined,
		left: Platform.OS === 'ios' ? undefined : 0,
		position: Platform.OS === 'ios' ? 'relative' : 'absolute',
		right: Platform.OS === 'ios' ? undefined : 0,
		width: Platform.OS === 'ios' ? undefined : '100%',
		zIndex: Platform.OS === 'ios' ? undefined : 100,
	},
	content: {
		alignItems: 'center',
		flex: 1,
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	subtitle: {
		color: Platform.OS === 'ios' ? theme.colors.gray.text : 'white',
		fontSize: theme.fontSizes.sm,
	},
	textContainer: {
		flex: 1,
	},
	title: {
		color: Platform.OS === 'ios' ? theme.colors.primary.solid : 'white',
	},
}))
