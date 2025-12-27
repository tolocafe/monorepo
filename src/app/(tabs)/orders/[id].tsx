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
import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import { ModifierTag } from '@/components/ModifierTag'
import { TabScreenContainer } from '@/components/ScreenContainer'
import SegmentedControl from '@/components/SegmentedControl'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { trackEvent } from '@/lib/analytics'
import { useProductDetails } from '@/lib/hooks/use-product-details'
import {
	confirmPlatformPayPayment,
	createApplePayConfig,
	createGooglePayConfig,
	getDefaultPaymentMethod,
	useStripe,
} from '@/lib/hooks/use-stripe'
import { selfQueryOptions } from '@/lib/queries/auth'
import { orderDetailQueryOptions, orderQueryOptions } from '@/lib/queries/order'
import { api } from '@/lib/services/api-service'
import { useSetTableContext } from '@/lib/stores/order-store'
import { downloadReceipt } from '@/lib/utils/download-receipt'
import { formatPrice } from '@/lib/utils/price'

import type { PaymentMethod } from '@/lib/hooks/use-stripe'

export default function OrderDetail() {
	const { t } = useLingui()
	const { id } = useLocalSearchParams<{ id: string }>()
	const queryClient = useQueryClient()
	const setTableContext = useSetTableContext()

	const [isDownloading, setIsDownloading] = useState(false)
	const [isPaymentLoading, setIsPaymentLoading] = useState(false)
	const { isPlatformPaySupported, presentPaymentSheet } = useStripe()
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
		getDefaultPaymentMethod(isPlatformPaySupported),
	)

	const {
		data: order,
		error,
		isLoading,
		refetch,
	} = useQuery(orderDetailQueryOptions(id))

	// Check if user is logged in
	const { data: user } = useQuery({
		...selfQueryOptions,
		retry: false,
	})

	// Fetch missing product details
	const productIds = useMemo(
		() => [...new Set((order?.products ?? []).map((p) => p.product_id))],
		[order?.products],
	)
	const { getProductName } = useProductDetails(productIds)

	// Order status helpers
	const isUnpaid = order?.status === '1' // status '1' = open/unpaid
	const total = Number(order?.payed_sum ?? order?.sum ?? 0) * 100 // Convert to cents

	// E-wallet balance
	const ewalletBalance = user ? Number(user.ewallet) || 0 : 0
	const hasEnoughBalance = ewalletBalance >= total

	// Can pay check
	const canPay =
		!isPaymentLoading &&
		user &&
		(paymentMethod !== 'ewallet' || hasEnoughBalance)

	// Create payment intent mutation
	const { mutateAsync: createPaymentIntent } = useMutation({
		mutationFn: () => {
			if (!order?.table_id) {
				throw new Error('No table ID found for this order')
			}
			// Use the table payment endpoint since this is a table order
			return api.tables.createPaymentIntent('1', order.table_id)
		},
	})

	// Invalidate queries after successful payment
	const invalidateQueries = async () => {
		await Promise.all([
			queryClient.invalidateQueries(selfQueryOptions),
			queryClient.invalidateQueries(orderQueryOptions),
			refetch(),
		])
	}

	// Handle adding more items
	const handleAddMoreItems = () => {
		if (!order?.table_id) return

		setTableContext({ locationId: '1', tableId: order.table_id })

		void trackEvent('table:order_start', { table_id: order.table_id })

		router.push('/(tabs)/(home)')
	}

	// Handle Apple/Google Pay
	const handlePlatformPayment = async () => {
		if (!order || !order.table_id) return

		void trackEvent('order:payment_start', {
			bill_total: total / 100,
			order_id: id,
			payment_method: paymentMethod,
		})

		try {
			setIsPaymentLoading(true)

			const { paymentIntent } = await createPaymentIntent()

			const { error: platformPayError } = await confirmPlatformPayPayment(
				paymentIntent.client_secret,
				Platform.OS === 'ios'
					? createApplePayConfig(total, `Order #${id}`)
					: createGooglePayConfig(total, `Order #${id}`),
			)

			if (platformPayError) {
				Alert.alert(t`Error`, platformPayError.message)
				return
			}

			await api.tables.pay('1', order.table_id, {
				paymentIntentId: paymentIntent.client_secret,
			})

			await invalidateQueries()

			void Burnt.toast({
				from: 'top',
				preset: 'done',
				title: t`Payment successful!`,
			})
		} catch {
			Alert.alert(t`Error`, t`Failed to process payment. Please try again.`)
		} finally {
			setIsPaymentLoading(false)
		}
	}

	// Handle card payment via Stripe sheet
	const handlePaymentSheetPayment = async () => {
		if (!order || !order.table_id) return

		void trackEvent('order:payment_start', {
			bill_total: total / 100,
			order_id: id,
			payment_method: paymentMethod,
		})

		try {
			setIsPaymentLoading(true)

			const response = await createPaymentIntent()
			const { error: presentError } = await presentPaymentSheet()

			if (presentError) {
				Alert.alert(t`Error`, presentError.message)
				return
			}

			await api.tables.pay('1', order.table_id, {
				paymentIntentId: response.paymentIntent.client_secret,
			})

			await invalidateQueries()

			void Burnt.toast({
				from: 'top',
				preset: 'done',
				title: t`Payment successful!`,
			})
		} catch {
			Alert.alert(t`Error`, t`Failed to process payment. Please try again.`)
		} finally {
			setIsPaymentLoading(false)
		}
	}

	// Handle e-wallet payment
	const handleEWalletPayment = async () => {
		if (!order || !user || !order.table_id) return

		if (!hasEnoughBalance) {
			Alert.alert(
				t`Insufficient Balance`,
				t`Your e-wallet balance is insufficient. Please top up or use another payment method.`,
			)
			return
		}

		void trackEvent('order:payment_start', {
			bill_total: total / 100,
			order_id: id,
			payment_method: paymentMethod,
		})

		try {
			setIsPaymentLoading(true)

			await api.tables.pay('1', order.table_id, {
				paymentMethod: 'ewallet',
			})

			await invalidateQueries()

			void Burnt.toast({
				from: 'top',
				preset: 'done',
				title: t`Payment successful!`,
			})
		} catch {
			Alert.alert(t`Error`, t`Failed to process payment. Please try again.`)
		} finally {
			setIsPaymentLoading(false)
		}
	}

	// Unified payment handler
	const handlePayment = async () => {
		if (!order) return

		if (paymentMethod === 'ewallet') {
			await handleEWalletPayment()
		} else if (
			paymentMethod === 'apple_pay' ||
			paymentMethod === 'google_pay'
		) {
			await handlePlatformPayment()
		} else {
			await handlePaymentSheetPayment()
		}
	}

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
					<RefreshControl onRefresh={() => refetch()} refreshing={false} />
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
							{order.table_name && (
								<Text style={styles.tableName}>
									<Trans>Table {order.table_name}</Trans>
								</Text>
							)}
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
							{isUnpaid && (
								<Text style={styles.unpaidBadge}>
									<Trans>Unpaid</Trans>
								</Text>
							)}
						</View>
					</View>
				</Card>

				{/* Order Items */}
				{order.products && order.products.length > 0 && (
					<>
						<H3>
							<Trans>Items</Trans>
						</H3>
						<Card>
							<View style={styles.itemsList}>
								{order.products.map((product, index) => (
									<View key={index} style={styles.itemContainer}>
										<View style={styles.itemRow}>
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
										{product.modificator_name && (
											<View style={styles.modifiersContainer}>
												<ModifierTag name={product.modificator_name} />
											</View>
										)}
									</View>
								))}
							</View>
						</Card>
					</>
				)}

				{/* Summary */}
				<H3>
					<Trans>Summary</Trans>
				</H3>
				<Card>
					<View style={styles.summaryRow}>
						<Text>
							<Trans>Subtotal</Trans>
						</Text>
						<Text>
							{formatPrice((Number(order.sum) - Number(order.tax_sum)) * 100)}
						</Text>
					</View>
					{Number(order.tax_sum) > 0 && (
						<View style={styles.summaryRow}>
							<Text>
								<Trans>Tax</Trans>
							</Text>
							<Text>{formatPrice(Number(order.tax_sum) * 100)}</Text>
						</View>
					)}
					{Number(order.tip_sum) > 0 && (
						<View style={styles.summaryRow}>
							<Text>
								<Trans>Tip</Trans>
							</Text>
							<Text>{formatPrice(Number(order.tip_sum) * 100)}</Text>
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
						<Text weight="bold">{formatPrice(total)}</Text>
					</View>
				</Card>

				{/* Payment Section for Unpaid Orders */}
				{isUnpaid && user && (
					<>
						{/* Add More Items Button */}
						{order.table_id && (
							<Button onPress={handleAddMoreItems} variant="surface">
								<Trans>Add More Items</Trans>
							</Button>
						)}

						{/* Payment Method Selector */}
						<H3>
							<Trans>Payment Method</Trans>
						</H3>
						<SegmentedControl
							onChange={(v) => setPaymentMethod(v as PaymentMethod)}
							value={paymentMethod}
						>
							{isPlatformPaySupported && Platform.OS === 'ios' && (
								<SegmentedControl.Segment
									icon="logo-apple"
									label={<Trans>Apple Pay</Trans>}
									value="apple_pay"
								/>
							)}
							{isPlatformPaySupported && Platform.OS === 'android' && (
								<SegmentedControl.Segment
									icon="logo-google"
									label={<Trans>Google Pay</Trans>}
									value="google_pay"
								/>
							)}
							<SegmentedControl.Segment
								icon="card-outline"
								label={<Trans>Card</Trans>}
								value="card"
							/>
							<SegmentedControl.Segment
								disabled={!hasEnoughBalance}
								icon="wallet-outline"
								label={<Trans>E-Wallet</Trans>}
								value="ewallet"
							/>
						</SegmentedControl>

						{/* E-Wallet Balance Info */}
						{paymentMethod === 'ewallet' && (
							<Card>
								<View style={styles.ewalletInfo}>
									<View style={styles.ewalletBalance}>
										<Feather name="credit-card" size={20} />
										<Text>
											<Trans>Balance: {formatPrice(ewalletBalance)}</Trans>
										</Text>
									</View>
									{!hasEnoughBalance && (
										<Button
											onPress={() => router.push('/(tabs)/more/top-up')}
											variant="surface"
										>
											<Trans>Top Up</Trans>
										</Button>
									)}
								</View>
							</Card>
						)}

						{/* Pay Button */}
						<Button
							disabled={!canPay}
							onPress={handlePayment}
							style={styles.payButton}
						>
							{isPaymentLoading ? (
								<ActivityIndicator color="#ffffff" />
							) : (
								<Trans>Pay {formatPrice(total)}</Trans>
							)}
						</Button>
					</>
				)}

				{/* Download Receipt for Paid Orders */}
				{!isUnpaid && (
					<Pressable
						disabled={isDownloading}
						onPress={handleDownloadReceipt}
						style={[
							styles.downloadButton,
							isDownloading && styles.downloadButtonDisabled,
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
				)}
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
	ewalletBalance: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	ewalletInfo: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'space-between',
	},
	itemContainer: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
		gap: theme.spacing.xs,
		paddingVertical: theme.spacing.sm,
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
	itemsList: {
		marginTop: theme.spacing.sm,
	},
	loadingContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	modifiersContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.xs,
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
		gap: theme.spacing.xs,
	},
	payButton: {
		marginTop: theme.spacing.md,
	},
	summaryRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: theme.spacing.sm,
	},
	tableName: {
		color: theme.colors.crema.solid,
		marginTop: theme.spacing.xs,
	},
	totalRow: {
		borderTopColor: theme.colors.gray.border,
		borderTopWidth: 1,
		marginTop: theme.spacing.sm,
		paddingTop: theme.spacing.sm,
	},
	unpaidBadge: {
		backgroundColor: theme.colors.rojo.background,
		borderRadius: theme.borderRadius.sm,
		color: theme.colors.rojo.solid,
		fontSize: 12,
		fontWeight: '600',
		overflow: 'hidden',
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
	},
}))
