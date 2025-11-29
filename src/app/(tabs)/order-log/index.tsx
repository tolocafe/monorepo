import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'
import { RefreshControl, View } from 'react-native'

import { Select, Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import type { DashTransaction } from '@common/api'

import { Card } from '@/components/Card'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { orderLogQueryOptions } from '@/lib/queries/order-log'
import { queryClient } from '@/lib/query-client'
import { formatPrice } from '@/lib/utils/price'

export default function OrderLogScreen() {
	const { t } = useLingui()
	const screenRef = useRef<ScrollView>(null)

	useScrollToTop(screenRef)

	const { data: orders, isLoading } = useQuery(orderLogQueryOptions)

	const handleRefresh = useCallback(() => {
		void queryClient.invalidateQueries(orderLogQueryOptions)
	}, [])

	// Sort orders by creation date (newest first)
	const sortedOrders = orders?.toSorted((a, b) => {
		const dateA = new Date(a.date_create.replaceAll('-', '/'))
		const dateB = new Date(b.date_create.replaceAll('-', '/'))
		return dateB.getTime() - dateA.getTime()
	})

	return (
		<>
			<Head>
				<title>{t`Order Log`}</title>
			</Head>
			<ScreenContainer
				contentContainerStyle={styles.container}
				noScroll={!sortedOrders?.length}
				ref={screenRef}
				refreshControl={
					<RefreshControl onRefresh={handleRefresh} refreshing={isLoading} />
				}
				withTopGradient
				withTopPadding
			>
				<H2>
					<Trans>Active Orders</Trans>
				</H2>

				{sortedOrders && sortedOrders.length > 0 ? (
					<View style={styles.ordersList}>
						{sortedOrders.map((order) => (
							<OrderCard key={order.transaction_id} order={order} />
						))}
					</View>
				) : (
					<View style={styles.emptyContainer}>
						<H3 align="center">
							<Trans>No active orders</Trans>
						</H3>
						<Paragraph align="center">
							<Trans>Orders will appear here when they come in</Trans>
						</Paragraph>
					</View>
				)}
			</ScreenContainer>
		</>
	)
}

/** Format time elapsed since creation */
function formatTimeElapsed(dateCreate: string): string {
	const created = new Date(dateCreate.replaceAll('-', '/'))
	const now = new Date()
	const diffMs = now.getTime() - created.getTime()

	const diffMinutes = Math.floor(diffMs / 60_000)
	const diffHours = Math.floor(diffMinutes / 60)

	if (diffMinutes < 1) {
		return 'Just now'
	}

	if (diffMinutes < 60) {
		return `${diffMinutes}m ago`
	}

	if (diffHours < 24) {
		const remainingMinutes = diffMinutes % 60
		return remainingMinutes > 0
			? `${diffHours}h ${remainingMinutes}m ago`
			: `${diffHours}h ago`
	}

	return `${Math.floor(diffHours / 24)}d ago`
}

/** Get customer display name from transaction */
function getCustomerName(order: DashTransaction): string {
	const firstName = order.client_firstname?.trim()
	const lastName = order.client_lastname?.trim()

	if (firstName && lastName) {
		return `${firstName} ${lastName}`
	}

	if (firstName) {
		return firstName
	}

	return `Table ${order.table_name || order.table_id}`
}

/** Processing status color mapping */
function getStatusColor(status: string): string {
	switch (status) {
		case '10': // Open
			return '#3D6039' // verde.solid
		case '20': // Preparing
			return '#F76B15' // naranja.solid
		case '30': // Ready
			return '#F5D90A' // amarillo.solid
		default:
			return '#666666' // gray.solid
	}
}

function OrderCard({ order }: { order: DashTransaction }) {
	const [timeElapsed, setTimeElapsed] = useState(() =>
		formatTimeElapsed(order.date_create),
	)

	// Update time elapsed every 30 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setTimeElapsed(formatTimeElapsed(order.date_create))
		}, 30_000)

		return () => clearInterval(interval)
	}, [order.date_create])

	const customerName = getCustomerName(order)
	const statusColor = getStatusColor(order.processing_status)

	return (
		<Card style={styles.orderCard}>
			<View style={styles.orderHeader}>
				<View style={styles.customerInfo}>
					<Text style={styles.customerName} weight="bold">
						{customerName}
					</Text>
					<Text style={styles.timeElapsed}>{timeElapsed}</Text>
				</View>
				<View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
					<Text style={styles.statusText}>
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
				</View>
			</View>

			{/* Order Products */}
			{order.products && order.products.length > 0 && (
				<View style={styles.productsContainer}>
					{order.products.map((product, index) => (
						<View
							key={`${product.product_id}-${index}`}
							style={styles.productRow}
						>
							<View style={styles.productInfo}>
								<Text style={styles.productQuantity}>{product.num}×</Text>
								<Text style={styles.productName}>
									{product.product_name || `Product #${product.product_id}`}
								</Text>
							</View>
							<Text style={styles.productPrice}>
								{formatPrice(Number(product.product_sum) * 100)}
							</Text>
						</View>
					))}
				</View>
			)}

			{/* Order Total */}
			<View style={styles.orderFooter}>
				<Text style={styles.totalLabel}>
					<Trans>Total</Trans>
				</Text>
				<Text style={styles.totalAmount} weight="bold">
					{formatPrice(Number(order.sum) * 100)}
				</Text>
			</View>
		</Card>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	customerInfo: {
		flex: 1,
		gap: theme.spacing.xxs,
	},
	customerName: {
		fontSize: theme.fontSizes.lg,
	},
	emptyContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingVertical: theme.spacing.xxl,
	},
	orderCard: {
		gap: theme.spacing.md,
	},
	orderFooter: {
		alignItems: 'center',
		borderTopColor: theme.colors.gray.border,
		borderTopWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: theme.spacing.md,
	},
	orderHeader: {
		alignItems: 'flex-start',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	ordersList: {
		gap: theme.spacing.md,
	},
	productInfo: {
		alignItems: 'center',
		flex: 1,
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	productName: {
		flex: 1,
		fontSize: theme.fontSizes.md,
	},
	productPrice: {
		color: theme.colors.crema.solid,
		fontSize: theme.fontSizes.sm,
	},
	productQuantity: {
		color: theme.colors.verde.solid,
		fontSize: theme.fontSizes.md,
		fontWeight: theme.fontWeights.bold,
		minWidth: 24,
	},
	productRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	productsContainer: {
		gap: theme.spacing.sm,
	},
	statusBadge: {
		borderRadius: theme.borderRadius.sm,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xxs,
	},
	statusText: {
		color: '#FFFFFF',
		fontSize: theme.fontSizes.xs,
		fontWeight: theme.fontWeights.bold,
	},
	timeElapsed: {
		color: theme.colors.crema.solid,
		fontSize: theme.fontSizes.sm,
	},
	totalAmount: {
		color: theme.colors.verde.solid,
		fontSize: theme.fontSizes.lg,
	},
	totalLabel: {
		color: theme.colors.crema.solid,
		fontSize: theme.fontSizes.md,
	},
}))
