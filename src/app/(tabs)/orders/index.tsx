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
import { Feather } from '@expo/vector-icons'

import type { Product } from '@common/api'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { selfQueryOptions } from '@/lib/queries/auth'
import { orderQueryOptions } from '@/lib/queries/order'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import {
	useCurrentOrder,
	useCurrentOrderItemsCount,
} from '@/lib/stores/order-store'
import { formatPrice, getProductTotalCost } from '@/lib/utils/price'

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
	const itemsCount = useCurrentOrderItemsCount()

	const currentOrderTotalCents = (() => {
		if (!currentOrder) return 0

		return currentOrder.products.reduce((sum, item) => {
			const productData = queryClient.getQueryData(
				productQueryOptions(item.id).queryKey,
			) as Product

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

	const handleOrderPress = (orderId: string) => {
		router.push(`/(tabs)/orders/${orderId}`)
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
								<H3>
									<Trans>Current Order</Trans>
								</H3>
								<Text>
									<Trans>{itemsCount} items</Trans>
								</Text>
								<Text>{formatPrice(currentOrderTotalCents)}</Text>
							</View>
							<Text>
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
											<Feather name="chevron-right" size={24} color="#666666" />
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
	currentOrderCard: {
		backgroundColor: theme.colors.verde.solid,
		borderCurve: 'continuous',
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
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
	orderDate: {
		color: theme.colors.crema.solid,
		marginTop: theme.spacing.xs,
	},
	orderDetails: {
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	orderRightSection: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.xs,
		justifyContent: 'center',
	},
	orderHeader: {
		flex: 1,
	},
	orderItems: {
		color: theme.colors.crema.solid,
		marginBottom: theme.spacing.xs,
	},

	ordersList: {
		gap: theme.spacing.sm,
		width: '100%',
	},
	orderStatus: {
		color: theme.colors.verde.solid,
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
	subtitle: {
		color: theme.colors.crema.solid,
	},
	tapToEdit: {
		color: theme.colors.gray.background,
		marginTop: theme.spacing.xs,
		opacity: 0.8,
	},
}))
