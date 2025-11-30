import { useCallback, useRef } from 'react'
import type { ImageSourcePropType, ScrollView } from 'react-native'
import { RefreshControl, TouchableOpacity, View } from 'react-native'

import { Feather } from '@expo/vector-icons'
import { Select, Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { resetBadgeCount } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'
import { orderQueryOptions } from '@/lib/queries/order'
import { queryClient } from '@/lib/query-client'
import {
	useCurrentOrder,
	useCurrentOrderItemsCount,
} from '@/lib/stores/order-store'
import { formatPrice, getProductTotalCost } from '@/lib/utils/price'

const handleSignIn = () => {
	router.push('/sign-in')
}

const handleOrderPress = (orderId: string) => {
	router.push(`/(tabs)/orders/${orderId}`)
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
	const itemsCount = useCurrentOrderItemsCount()

	useFocusEffect(
		useCallback(() => {
			void resetBadgeCount()
		}, []),
	)

	const currentOrderTotalCents = currentOrder?.products.reduce(
		(sum, item) =>
			sum +
			getProductTotalCost({
				modifications: item.modifications ?? {},
				product: item.id,
				quantity: item.quantity,
			}),
		0,
	)

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
								<Text style={styles.currentOrderText} weight="bold">
									<Trans>Current Order</Trans>
								</Text>
								<View style={styles.currentOrderBottomText}>
									<Text style={styles.currentOrderText}>
										<Trans>{itemsCount} items</Trans>
									</Text>
									<Text style={styles.currentOrderText}>
										{formatPrice(currentOrderTotalCents ?? 0)}
									</Text>
								</View>
							</View>
							<Text style={styles.currentOrderText}>
								<Feather name="chevron-right" size={24} />
							</Text>
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
								<TouchableOpacity
									key={order.transaction_id}
									onPress={() => handleOrderPress(order.transaction_id)}
								>
									<Card style={styles.orderCard}>
										<View>
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
											<Text>
												{new Date(
													Number(order.date_start),
												).toLocaleDateString()}
											</Text>
										</View>
										<View style={styles.orderDetails}>
											<Text>{formatPrice(order.sum)}</Text>
											<Feather color="#666666" name="chevron-right" size={24} />
										</View>
									</Card>
								</TouchableOpacity>
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
	currentOrderBottomText: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	currentOrderCard: {
		alignItems: 'center',
		backgroundColor: theme.colors.verde.solid,
		borderCurve: 'continuous',
		borderRadius: theme.borderRadius.md,
		flexDirection: 'row',
		gap: theme.spacing.sm,
		padding: theme.spacing.lg,
	},
	currentOrderText: {
		color: 'white',
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
	image: {
		height: 250,
		width: 250,
	},
	orderCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	orderDetails: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'space-between',
	},
	orderHeader: {
		flex: 1,
		gap: theme.spacing.xs,
	},
	ordersList: {
		gap: theme.spacing.sm,
		width: '100%',
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
		color: theme.colors.crema.solid,
		textAlign: 'center',
	},
	signInTitle: {
		textAlign: 'center',
	},
}))
