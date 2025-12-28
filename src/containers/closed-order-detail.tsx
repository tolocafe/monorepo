import { useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	Platform,
	Pressable,
	RefreshControl,
	View,
} from 'react-native'

import { Feather } from '@expo/vector-icons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import { HeaderIconIonicons } from '@/components/Icons'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { useProductDetails } from '@/lib/hooks/use-product-details'
import { orderDetailQueryOptions } from '@/lib/queries/order'
import { queryClient } from '@/lib/query-client'
import { downloadReceipt } from '@/lib/utils/download-receipt'
import { formatPrice } from '@/lib/utils/price'

const handleClose = () => {
	router.back()
}

const GrayIonIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.text,
}))

const PADDING_EDGES = ['bottom', 'top'] as const

export default function ClosedOrderDetail({ orderId }: { orderId: string }) {
	const { t } = useLingui()
	const [isDownloading, setIsDownloading] = useState(false)

	const {
		data: order,
		error,
		isLoading,
	} = useQuery(orderDetailQueryOptions(orderId))

	const productIds = useMemo(
		() => [...new Set((order?.products ?? []).map((p) => p.product_id))],
		[order?.products],
	)
	const { getProductName } = useProductDetails(productIds)

	const handleDownloadReceipt = async () => {
		if (!orderId) return

		try {
			setIsDownloading(true)
			await downloadReceipt(orderId)
		} catch {
			Alert.alert(t`Error`, t`Failed to download receipt. Please try again.`, [
				{ text: t`OK` },
			])
		} finally {
			setIsDownloading(false)
		}
	}

	if (isLoading) {
		return (
			<ScreenContainer>
				<Stack.Screen options={{ title: t`Loading...` }} />
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" />
					<H2>
						<Trans>Loading Order...</Trans>
					</H2>
				</View>
			</ScreenContainer>
		)
	}

	if (error || !order) {
		return (
			<ScreenContainer>
				<Stack.Screen options={{ title: t`Order Not Found` }} />
				<View style={styles.header}>
					<Pressable onPress={handleClose} style={styles.closeButton}>
						<GrayIonIcon name="close" size={20} />
					</Pressable>
				</View>
				<View style={styles.errorContainer}>
					<H2>
						<Trans>Order Not Found</Trans>
					</H2>
					<Paragraph>
						<Trans>{`The order you're looking for doesn't exist.`}</Trans>
					</Paragraph>
					<Button onPress={() => router.back()}>
						<Trans>Go Back</Trans>
					</Button>
				</View>
			</ScreenContainer>
		)
	}

	const orderStatus =
		{
			10: t`Open`,
			20: t`Preparing`,
			30: t`Ready`,
			40: t`En route`,
			50: t`Delivered`,
			60: t`Closed`,
			70: t`Deleted`,
		}[order.processing_status] ?? t`Unknown`

	return (
		<>
			<Stack.Screen
				options={{
					headerRight: Platform.select({
						default: undefined,
						ios: () => (
							<Pressable onPress={handleClose}>
								<HeaderIconIonicons name="close-outline" size={35} />
							</Pressable>
						),
					}),
					title: t`Order #${orderId}`,
				}}
			/>
			<ScreenContainer
				contentContainerStyle={styles.container}
				refreshControl={
					<RefreshControl
						onRefresh={() =>
							queryClient.invalidateQueries(orderDetailQueryOptions(orderId))
						}
						refreshing={false}
					/>
				}
				withHeaderPadding
				withPaddingEdges={PADDING_EDGES}
			>
				<View style={styles.content}>
					<Card style={styles.orderHeaderCard}>
						<View style={styles.orderHeader}>
							<View>
								<H2>
									<Trans>Order</Trans> #{orderId}
								</H2>
								<Text style={styles.orderDate}>
									{new Date(Number(order.date_start)).toLocaleDateString(
										undefined,
										{
											day: 'numeric',
											month: 'long',
											weekday: 'long',
											year: 'numeric',
										},
									)}
								</Text>
							</View>
							<View style={styles.statusBadge}>
								<Text style={styles.statusBadgeText}>{orderStatus}</Text>
							</View>
						</View>
					</Card>

					{order.products && order.products.length > 0 && (
						<Card style={styles.itemsCard}>
							<H3>
								<Trans>Items</Trans>
							</H3>
							<View style={styles.itemsList}>
								{order.products.map((product, index) => (
									<View key={index} style={styles.itemRow}>
										<View style={styles.itemInfo}>
											<Text weight="bold">
												{getProductName(product.product_id)}
											</Text>
											<Text style={styles.itemQuantity}>
												<Trans>Qty: {Math.round(Number(product.num))}</Trans>
											</Text>
										</View>
										<Text weight="bold">
											{formatPrice(
												Number(product.product_price) * Number(product.num),
											)}
										</Text>
									</View>
								))}
							</View>
						</Card>
					)}

					<Card style={styles.summaryCard}>
						<H3>
							<Trans>Summary</Trans>
						</H3>
						<View style={styles.summaryRow}>
							<Text>
								<Trans>Subtotal</Trans>
							</Text>
							<Text>
								{formatPrice(Number(order.sum) - Number(order.tax_sum))}
							</Text>
						</View>
						{Number(order.tax_sum) > 0 && (
							<View style={styles.summaryRow}>
								<Text>
									<Trans>Tax</Trans>
								</Text>
								<Text>{formatPrice(order.tax_sum)}</Text>
							</View>
						)}
						{Number(order.tip_sum) > 0 && (
							<View style={styles.summaryRow}>
								<Text>
									<Trans>Tip</Trans>
								</Text>
								<Text>{formatPrice(order.tip_sum)}</Text>
							</View>
						)}
						{Number(order.discount || 0) > 0 && (
							<View style={styles.summaryRow}>
								<Text>
									<Trans>Discount</Trans>
								</Text>
								<Text style={styles.discountText}>{order.discount}%</Text>
							</View>
						)}
						<View style={[styles.summaryRow, styles.totalRow]}>
							<Text weight="bold">
								<Trans>Total</Trans>
							</Text>
							<Text weight="bold">{formatPrice(order.payed_sum)}</Text>
						</View>
					</Card>

					<Pressable
						disabled={isDownloading || order.processing_status === 10}
						onPress={handleDownloadReceipt}
						style={[
							styles.downloadButton,
							(isDownloading || order.processing_status === 10) &&
								styles.downloadButtonDisabled,
						]}
					>
						<View style={styles.downloadButtonContent}>
							{isDownloading ? (
								<ActivityIndicator color="#ffffff" size="small" />
							) : (
								<Feather color="#ffffff" name="download" size={20} />
							)}
							<Text style={styles.downloadButtonText}>
								{isDownloading ? (
									<Trans>Downloading...</Trans>
								) : (
									<Trans>Download Receipt</Trans>
								)}
							</Text>
						</View>
					</Pressable>
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	closeButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.full,
		elevation: 5,
		height: theme.spacing.xl,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			height: 2,
			width: 0,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		width: theme.spacing.xl,
	},
	container: {
		gap: 0,
	},
	content: {
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	discountText: {
		color: theme.colors.verde.solid,
		fontWeight: '600',
	},
	downloadButton: {
		backgroundColor: theme.colors.verde.solid,
		borderCurve: 'continuous',
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
	},
	downloadButtonContent: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'center',
	},
	downloadButtonDisabled: {
		opacity: 0.7,
	},
	downloadButtonText: {
		color: theme.colors.gray.background,
		fontWeight: '600',
	},
	errorContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		padding: theme.spacing.lg,
		position: 'absolute',
		right: 0,
		top: 40,
		zIndex: 1,
	},
	itemInfo: {
		flex: 1,
	},
	itemQuantity: {
		color: theme.colors.crema.solid,
		fontSize: 12,
		marginTop: theme.spacing.xs,
	},
	itemRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	itemsCard: {
		width: '100%',
	},
	itemsList: {
		gap: theme.spacing.sm,
		marginTop: theme.spacing.sm,
	},
	loadingContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	orderDate: {
		color: theme.colors.crema.solid,
		marginTop: theme.spacing.xs,
	},
	orderHeader: {
		alignItems: 'flex-start',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	orderHeaderCard: {
		width: '100%',
	},
	statusBadge: {
		backgroundColor: theme.colors.verde.solid,
		borderRadius: theme.borderRadius.sm,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.xs,
	},
	statusBadgeText: {
		color: '#FFFFFF',
		fontSize: theme.fontSizes.sm,
		fontWeight: theme.fontWeights.semibold,
	},
	summaryCard: {
		width: '100%',
	},
	summaryRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: theme.spacing.sm,
	},
	totalRow: {
		borderTopColor: theme.colors.gray.border,
		borderTopWidth: 1,
		marginTop: theme.spacing.sm,
		paddingTop: theme.spacing.sm,
	},
}))
