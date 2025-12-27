import { useCallback, useRef } from 'react'
import type { ImageSourcePropType, ScrollView } from 'react-native'
import { Pressable, RefreshControl, View } from 'react-native'

import { Feather } from '@expo/vector-icons'
import { Select, Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import { TabScreenContainer } from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { resetBadgeCount } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'
import { orderQueryOptions } from '@/lib/queries/order'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import {
	useCurrentOrder,
	useCurrentOrderItemsCount,
} from '@/lib/stores/order-store'
import { formatPrice, getProductTotalCost } from '@/lib/utils/price'

import type { Product } from '~common/api'

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
	const { data: orders, isRefetching } = useQuery(orderQueryOptions)
	const itemsCount = useCurrentOrderItemsCount()

	// Filter orders by payment status (status 1 = Open/Unpaid, status 2 = Closed/Paid)
	const unpaidOrders = orders?.filter((order) => order.status === '1') ?? []
	const paidOrders = orders?.filter((order) => order.status !== '1') ?? []

	useFocusEffect(
		useCallback(() => {
			void resetBadgeCount()
		}, []),
	)

	const currentOrderTotalCents = (() => {
		if (!currentOrder) return 0

		return currentOrder.products.reduce((sum, item) => {
			const productData = queryClient.getQueryData<Product>(
				productQueryOptions(item.id).queryKey,
			)

			return (
				sum +
				getProductTotalCost({
					modifications: item.modifications ?? {},
					product: productData,
					quantity: item.quantity,
				})
			)
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
				<TabScreenContainer noScroll>
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
				</TabScreenContainer>
			</>
		)
	}

	return (
		<>
			<Head>
				<title>{t`Orders`}</title>
			</Head>
			<TabScreenContainer
				contentContainerStyle={styles.contentContainer}
				noScroll={!orders?.length}
				ref={screenRef}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries(orderQueryOptions)}
						refreshing={isRefetching}
					/>
				}
				withTopGradient
			>
				{/* Current Order in Progress */}
				{currentOrder && (
					<>
						<H2>
							<Trans>In Progress</Trans>
						</H2>
						<Pressable
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
										{formatPrice(currentOrderTotalCents)}
									</Text>
								</View>
							</View>
							<Text style={styles.currentOrderText}>
								<Feather name="chevron-right" size={24} />
							</Text>
						</Pressable>
					</>
				)}

				{/* Unpaid Orders */}
				{unpaidOrders.length > 0 && (
					<>
						<H2>
							<Trans>Unpaid</Trans>
						</H2>
						<View style={styles.ordersList}>
							{unpaidOrders.map((order) => (
								<Pressable
									key={order.transaction_id}
									onPress={() =>
										router.push(`/(tabs)/orders/pay/${order.transaction_id}`)
									}
								>
									<Card style={styles.unpaidOrderCard}>
										<View style={styles.orderHeader}>
											<Text weight="bold">
												<Trans>Order #{order.transaction_id}</Trans>
											</Text>
											<Text style={styles.unpaidLabel}>
												<Trans>Payment Required</Trans>
											</Text>
										</View>
										<View style={styles.orderDetails}>
											<Text weight="bold">{formatPrice(order.sum)}</Text>
											<Feather color="#666666" name="chevron-right" size={24} />
										</View>
									</Card>
								</Pressable>
							))}
						</View>
					</>
				)}

				{/* Order History */}
				{paidOrders.length > 0 ? (
					<>
						<H2>
							<Trans>History</Trans>
						</H2>
						<View style={styles.ordersList}>
							{paidOrders.map((order) => (
								<Pressable
									key={order.transaction_id}
									onPress={() => handleOrderPress(order.transaction_id)}
								>
									<Card style={styles.orderCard}>
										<View>
											{order.status === '4' ? (
												<Text weight="bold">Declined</Text>
											) : (
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
											)}
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
								</Pressable>
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
			</TabScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	contentContainer: {
		gap: theme.spacing.md,
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
	unpaidLabel: {
		color: theme.colors.rojo.solid ?? '#e53e3e',
		fontSize: 12,
	},
	unpaidOrderCard: {
		borderColor: theme.colors.rojo.solid ?? '#e53e3e',
		borderWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	signInSubtitle: {
		color: theme.colors.crema.solid,
		textAlign: 'center',
	},
	signInTitle: {
		textAlign: 'center',
	},
}))
