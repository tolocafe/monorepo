import { Feather } from '@expo/vector-icons'
import { Select, Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack, useFocusEffect } from 'expo-router'
import Head from 'expo-router/head'
import { useCallback, useRef } from 'react'
import { Pressable, RefreshControl, View } from 'react-native'
import type { ImageSourcePropType, ScrollView } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Card from '~/components/Card'
import ScreenContainer from '~/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '~/components/Text'
import { useTrackScreenView } from '~/lib/analytics/hooks'
import { resetBadgeCount } from '~/lib/notifications'
import { selfQueryOptions } from '~/lib/queries/auth'
import { orderQueryOptions } from '~/lib/queries/order'
import { queryClient } from '~/lib/query-client'
import { formatPrice } from '~/lib/utils/price'

const handleOrderPress = (orderId: string) => {
	router.push(`/(tabs)/profile/orders/${orderId}`)
}

const UniImage = withUnistyles(Image)

export default function OrdersScreen() {
	const { t } = useLingui()
	const { data: user } = useQuery(selfQueryOptions)

	const isAuthenticated = Boolean(user)
	const screenRef = useRef<ScrollView>(null)

	useScrollToTop(screenRef)

	const { data: orders, isRefetching } = useQuery(orderQueryOptions)

	useFocusEffect(
		useCallback(() => {
			void resetBadgeCount()
		}, []),
	)

	useTrackScreenView({ screenName: 'orders' }, [])

	if (!isAuthenticated) {
		return (
			<>
				<Head>
					<title>{t`Orders`}</title>
				</Head>
				<Stack.Screen>
					<Stack.Header>
						<Stack.Header.Title>{t`Orders`}</Stack.Header.Title>
					</Stack.Header>
				</Stack.Screen>
				<ScreenContainer noScroll>
					<View style={styles.signInContainer}>
						<UniImage
							contentFit="contain"
							source={
								require('~/assets/images/beverages.png') as ImageSourcePropType
							}
							style={styles.image}
						/>
						<H2 style={styles.signInTitle}>
							<Trans>Sign In Required</Trans>
						</H2>
						<Paragraph style={styles.signInSubtitle}>
							<Trans>Please sign in to view your order history</Trans>
						</Paragraph>
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
			<Stack.Screen>
				<Stack.Header>
					<Stack.Header.Title>{t`Orders`}</Stack.Header.Title>
				</Stack.Header>
			</Stack.Screen>
			<ScreenContainer
				contentContainerStyle={styles.contentContainer}
				noScroll={!orders?.length}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries(orderQueryOptions)}
						refreshing={isRefetching}
					/>
				}
			>
				{orders?.length ? (
					<>
						<H2>
							<Trans>History</Trans>
						</H2>
						<View style={styles.ordersList}>
							{orders.map((order) => (
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
								require('~/assets/images/beverages-empty.png') as ImageSourcePropType
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
	contentContainer: {
		gap: theme.spacing.md,
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
		color: theme.colors.gray.solid,
		textAlign: 'center',
	},
	signInTitle: {
		textAlign: 'center',
	},
}))
