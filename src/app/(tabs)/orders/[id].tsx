import { Feather } from '@expo/vector-icons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import { useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	Pressable,
	RefreshControl,
	View,
} from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import { TabScreenContainer } from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { useProductDetails } from '@/lib/hooks/use-product-details'
import { orderDetailQueryOptions } from '@/lib/queries/order'
import { downloadReceipt } from '@/lib/utils/download-receipt'
import { formatPrice } from '@/lib/utils/price'

export default function OrderScreen() {
	const { t } = useLingui()
	const { id } = useLocalSearchParams<{ id: string }>()
	const [isDownloading, setIsDownloading] = useState(false)

	useTrackScreenView({ screenName: 'order', order_id: id }, [id])

	const {
		data: order,
		error,
		isLoading,
	} = useQuery(orderDetailQueryOptions(id))

	// Fetch missing product details
	const productIds = useMemo(
		() => [...new Set((order?.products ?? []).map((p) => p.product_id))],
		[order?.products],
	)
	const { getProductName } = useProductDetails(productIds)

	const handleDownloadReceipt = async () => {
		if (!id) return

		try {
			setIsDownloading(true)
			await downloadReceipt(id)
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
			<>
				<Head>
					<title>{t`Loading Order`}</title>
				</Head>
				<TabScreenContainer>
					<View style={styles.loadingContainer}>
						<H2>
							<Trans>Loading Order...</Trans>
						</H2>
					</View>
				</TabScreenContainer>
			</>
		)
	}

	if (error || !order) {
		return (
			<>
				<Head>
					<title>{t`Order Not Found`}</title>
				</Head>
				<TabScreenContainer>
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
				</TabScreenContainer>
			</>
		)
	}

	return (
		<>
			<Head>
				<title>{t`Order ${id}`}</title>
			</Head>
			<TabScreenContainer
				contentContainerStyle={styles.container}
				refreshControl={
					<RefreshControl
						onRefresh={() => {
							// Refresh orders data
						}}
						refreshing={false}
					/>
				}
				withHeaderPadding
				withTopGradient
			>
				{/* Order Header */}
				<Card style={styles.orderHeaderCard}>
					<View style={styles.orderHeader}>
						<View>
							<H2>#{id}</H2>
							<Text style={styles.orderDate}>
								{new Date(Number(order.date_start)).toLocaleDateString()}
							</Text>
						</View>
						<View style={styles.orderStatus}>
							<Text weight="bold">
								<Trans>
									{order.processing_status === 10 && 'Open'}
									{order.processing_status === 20 && 'Preparing'}
									{order.processing_status === 30 && 'Ready'}
									{order.processing_status === 40 && 'En route'}
									{order.processing_status === 50 && 'Delivered'}
									{order.processing_status === 60 && 'Closed'}
									{order.processing_status === 70 && 'Deleted'}
									{!order.processing_status && 'Unknown'}
								</Trans>
							</Text>
						</View>
					</View>
				</Card>

				{/* Order Items */}
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
			</TabScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
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
	orderStatus: {
		alignItems: 'flex-end',
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
