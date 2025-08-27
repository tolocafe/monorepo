import { useRef } from 'react'
import type { ImageSourcePropType, ScrollView } from 'react-native'
import { RefreshControl, TouchableOpacity, View } from 'react-native'

import { Select, Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { selfQueryOptions } from '@/lib/queries/auth'
import { orderQueryOptions } from '@/lib/queries/order'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import { useCurrentOrder, useOrderStats } from '@/lib/stores/order-store'
import { formatPrice } from '@/lib/utils/price'

const handleSignIn = () => {
	router.push('/sign-in')
}

const UniImage = withUnistyles(Image)

export default function Orders() {
	const { t } = useLingui()
	const { data: user } = useQuery(selfQueryOptions)

	const isAuthenticated = Boolean(user)
	const screenRef = useRef<ScrollView>(null)

	useScrollToTop(screenRef)

	const currentOrder = useCurrentOrder()
	const { data: orders } = useQuery(orderQueryOptions)
	const { totalItems } = useOrderStats()

	const currentOrderTotalCents = (() => {
		if (!currentOrder) return 0
		return currentOrder.products.reduce((sum, item) => {
			const productData = queryClient.getQueryData(
				productQueryOptions(item.id).queryKey,
			)
			const unitPriceCents = productData
				? Number(Object.values(productData.price ?? {}).at(0) ?? 0)
				: 0
			const modificationsTotalCents = (item.modifications ?? []).reduce(
				(moduleSum, module_) => moduleSum + (module_.price || 0),
				0,
			)
			return sum + (unitPriceCents + modificationsTotalCents) * item.quantity
		}, 0)
	})()

	const handleCurrentOrderPress = () => {
		if (currentOrder) {
			router.push(`/(tabs)/orders/current`)
		}
	}

	// removed renderOrderItem as current order should not appear in history

	if (!isAuthenticated) {
		return (
			<>
				<Head>
					<title>{t`Orders`}</title>
				</Head>
				<ScreenContainer noScroll>
					<View style={styles.signInContainer}>
						<UniImage
							contentFit="contain"
							source={
								require('@/assets/images/beverages.png') as ImageSourcePropType
							}
							style={styles.image}
						/>
						<H2 style={styles.signInTitle}>
							<Trans>Sign In Required</Trans>
						</H2>
						<Paragraph style={styles.signInSubtitle}>
							<Trans>Please sign in to view your order history</Trans>
						</Paragraph>
						<Button onPress={handleSignIn}>
							<Trans>Sign In</Trans>
						</Button>
					</View>
				</ScreenContainer>
			</>
		)
	}

	return (
		<>
			<Head>
				<title>{t`Orders`}</title>
			</Head>
			<ScreenContainer
				contentContainerStyle={styles.container}
				noScroll={!orders?.length}
				ref={screenRef}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries(orderQueryOptions)}
						refreshing={false}
					/>
				}
				withTopGradient
				withTopPadding
			>
				{/* Current Order in Progress */}
				{currentOrder && (
					<>
						<H2>
							<Trans>In Progress</Trans>
						</H2>
						<TouchableOpacity
							onPress={handleCurrentOrderPress}
							style={styles.currentOrderCard}
						>
							<View style={styles.orderHeader}>
								<H3 style={styles.currentOrderTitle}>
									<Trans>Current Order</Trans>
								</H3>
								<Text style={styles.orderBadge}>
									<Trans>{totalItems} items</Trans>
								</Text>
							</View>
							<Paragraph style={styles.currentOrderText}>
								{formatPrice(currentOrderTotalCents)}
							</Paragraph>
							<Paragraph style={styles.tapToEdit}>
								<Trans>Tap to view and edit</Trans>
							</Paragraph>
						</TouchableOpacity>
					</>
				)}

				{/* Order History */}

				{orders?.length ? (
					<>
						<H2>
							<Trans>History</Trans>
						</H2>
						<View style={styles.ordersList}>
							{orders.map((order) => (
								<Card key={order.transaction_id} style={styles.orderCard}>
									<Text weight="bold">
										<Select
											_Status10="Open"
											_Status20="Preparing"
											_Status30="Ready"
											_Status40="En route"
											_Status50="Delivered"
											_Status60="Closed"
											_Status70="Deleted"
											other="Unknown"
											value={`Status${order.processing_status}`}
										/>
									</Text>
									<View style={styles.orderDetails}>
										<Text>
											{new Date(Number(order.date_start)).toLocaleDateString()}
										</Text>
										<Text>{formatPrice(order.sum)}</Text>
									</View>
								</Card>
							))}
						</View>
					</>
				) : (
					<View style={styles.emptyOrderContainer}>
						<Image
							contentFit="contain"
							source={
								require('@/assets/images/beverages-empty.png') as ImageSourcePropType
							}
							style={styles.emptyOrderImage}
						/>
						<H3 align="center">
							<Trans>No orders yet</Trans>
						</H3>
						<Paragraph align="center">
							<Trans>Your order history will appear here</Trans>
						</Paragraph>
					</View>
				)}
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	currentOrderCard: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
	},
	currentOrderText: {
		color: theme.colors.surface,
	},
	currentOrderTitle: {
		color: theme.colors.surface,
	},
	emptyOrderContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
	emptyOrderImage: {
		height: 250,
		width: 250,
	},
	image: { height: 250, width: 250 },
	orderBadge: {
		color: theme.colors.surface,
		opacity: 0.9,
	},
	orderCard: {
		flexDirection: 'column',
		justifyContent: 'space-between',
		width: '100%',
	},
	orderDate: {
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.xs,
	},
	orderDetails: {
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'space-between',
	},
	orderHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: theme.spacing.sm,
	},
	orderItems: {
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
	},

	ordersList: {
		gap: theme.spacing.sm,
		width: '100%',
	},
	orderStatus: {
		color: theme.colors.primary,
	},
	signInContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.xxl,
	},
	signInSubtitle: {
		color: theme.colors.textSecondary,
		textAlign: 'center',
	},
	signInTitle: {
		textAlign: 'center',
	},
	subtitle: {
		color: theme.colors.textSecondary,
	},
	tapToEdit: {
		color: theme.colors.surface,
		marginTop: theme.spacing.xs,
		opacity: 0.8,
	},
}))
