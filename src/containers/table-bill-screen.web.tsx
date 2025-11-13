import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import PhoneNumberInput from '@/components/phone-number-input'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { useProductDetails } from '@/lib/hooks/use-product-details'
import { selfQueryOptions } from '@/lib/queries/auth'
import { tableQueryOptions } from '@/lib/queries/tables'
import { api } from '@/lib/services/api-service'
import { formatPrice } from '@/lib/utils/price'

export default function TableBillScreenWeb() {
	const { t } = useLingui()
	const { location_id, table_id } = useLocalSearchParams<{
		location_id: string
		table_id: string
	}>()
	const queryClient = useQueryClient()

	const [phoneNumber, setPhoneNumber] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [paymentSuccess, setPaymentSuccess] = useState(false)

	// Check if user is logged in (optional, may fail with 401)
	const { data: user } = useQuery(selfQueryOptions)

	// Fetch table bill
	const {
		data: tableBill,
		error,
		isLoading: isBillLoading,
	} = useQuery(tableQueryOptions(location_id, table_id))

	// Fetch missing product details
	const productIds = useMemo(
		() => [...new Set((tableBill?.items ?? []).map((item) => item.productId))],
		[tableBill?.items],
	)
	const { getProductName } = useProductDetails(productIds)

	// Auto-dismiss after successful payment
	useEffect(() => {
		if (paymentSuccess) {
			const timer = setTimeout(() => {
				router.back()
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [paymentSuccess])

	const handlePayment = async () => {
		if (!tableBill) return
		if (!user && !phoneNumber) {
			Alert.alert(t`Error`, t`Please provide your phone number to continue`)
			return
		}

		try {
			setIsLoading(true)

			// Create payment intent
			const { paymentIntent } = await api.tables.createPaymentIntent(
				location_id,
				table_id,
			)

			if (!paymentIntent.client_secret) {
				Alert.alert(t`Error`, t`Failed to initialize payment`)
				return
			}

			// Load Stripe.js dynamically
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stripe = await loadStripe()

			if (!stripe) {
				Alert.alert(t`Error`, t`Failed to load Stripe`)
				return
			}

			// Confirm payment
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			const { error: confirmError } = await stripe.confirmPayment({
				clientSecret: paymentIntent.client_secret,
				confirmParams: {
					return_url: globalThis.location.href,
				},
				redirect: 'if_required',
			})

			if (confirmError) {
				const errorMessage =
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					(confirmError.message as string | undefined) || t`Payment failed`
				Alert.alert(t`Error`, errorMessage)
				return
			}

			// Mark transaction as paid in Poster
			await api.tables.pay(location_id, table_id, {
				paymentIntentId: paymentIntent.client_secret,
				phone: !user && phoneNumber ? phoneNumber : undefined,
			})

			// Invalidate queries to refresh wallet/transactions
			await queryClient.invalidateQueries(selfQueryOptions)

			// Show success
			setPaymentSuccess(true)
		} catch {
			Alert.alert(t`Error`, t`Failed to process payment. Please try again.`)
		} finally {
			setIsLoading(false)
		}
	}

	// Loading state
	if (isBillLoading) {
		return (
			<>
				<Head>
					<title>{t`Loading Table Bill`}</title>
				</Head>
				<Stack.Screen
					options={{
						presentation: 'modal',
						title: t`Table Bill`,
					}}
				/>
				<ScreenContainer>
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" />
						<Paragraph>
							<Trans>Loading bill...</Trans>
						</Paragraph>
					</View>
				</ScreenContainer>
			</>
		)
	}

	// Error state
	if (error || !tableBill) {
		return (
			<>
				<Head>
					<title>{t`Table Not Found`}</title>
				</Head>
				<Stack.Screen
					options={{
						presentation: 'modal',
						title: t`Table Bill`,
					}}
				/>
				<ScreenContainer>
					<View style={styles.errorContainer}>
						<H2>
							<Trans>Table Not Found</Trans>
						</H2>
						<Paragraph>
							<Trans>
								No active bill was found for this table. Please check with
								staff.
							</Trans>
						</Paragraph>
						<Button onPress={() => router.back()}>
							<Trans>Close</Trans>
						</Button>
					</View>
				</ScreenContainer>
			</>
		)
	}

	// Success state
	if (paymentSuccess) {
		return (
			<>
				<Head>
					<title>{t`Payment Successful`}</title>
				</Head>
				<Stack.Screen
					options={{
						presentation: 'modal',
						title: t`Payment Successful`,
					}}
				/>
				<ScreenContainer>
					<View style={styles.successContainer}>
						<H2>
							<Trans>✓ Payment Successful!</Trans>
						</H2>
						<Paragraph>
							<Trans>
								Your payment has been processed. Thank you for dining with us!
							</Trans>
						</Paragraph>
					</View>
				</ScreenContainer>
			</>
		)
	}

	// At this point, tableBill is guaranteed to be defined
	return (
		<>
			<Head>
				<title>{t`${tableBill.tableName} - Bill`}</title>
			</Head>
			<Stack.Screen
				options={{
					presentation: 'modal',
					title: tableBill.tableName,
				}}
			/>
			<ScreenContainer contentContainerStyle={styles.container}>
				{/* Table Header */}
				<Card>
					<H2>{tableBill.tableName}</H2>
				</Card>

				{/* Items */}
				<Card>
					<H3>
						<Trans>Items</Trans>
					</H3>
					<View style={styles.itemsList}>
						{tableBill.items.map((item, index) => (
							<View key={index} style={styles.itemRow}>
								<View style={styles.itemInfo}>
									<Text weight="bold">{getProductName(item.productId)}</Text>
									<Text style={styles.itemQuantity}>
										<Trans>Qty: {item.quantity}</Trans>
									</Text>
								</View>
								<Text weight="bold">
									{formatPrice(item.price * item.quantity)}
								</Text>
							</View>
						))}
					</View>
				</Card>

				{/* Summary */}
				<Card>
					<H3>
						<Trans>Summary</Trans>
					</H3>
					<View style={styles.summaryRow}>
						<Text>
							<Trans>Subtotal</Trans>
						</Text>
						<Text>{formatPrice(tableBill.subtotal)}</Text>
					</View>
					{tableBill.tax > 0 && (
						<View style={styles.summaryRow}>
							<Text>
								<Trans>Tax</Trans>
							</Text>
							<Text>{formatPrice(tableBill.tax)}</Text>
						</View>
					)}
					<View style={[styles.summaryRow, styles.totalRow]}>
						<Text weight="bold">
							<Trans>Total</Trans>
						</Text>
						<Text weight="bold">{formatPrice(tableBill.total)}</Text>
					</View>
				</Card>

				{/* Phone Input for Guests */}
				{!user && (
					<Card>
						<H3>
							<Trans>Your Phone Number</Trans>
						</H3>
						<Paragraph style={styles.phoneHint}>
							<Trans>We need your phone number to process this payment.</Trans>
						</Paragraph>
						<PhoneNumberInput onChange={setPhoneNumber} value={phoneNumber} />
					</Card>
				)}

				{/* Payment Button */}
				<Button
					disabled={isLoading || (!user && !phoneNumber)}
					onPress={handlePayment}
					style={styles.payButton}
				>
					{isLoading ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<Trans>Pay {formatPrice(tableBill.total)}</Trans>
					)}
				</Button>
			</ScreenContainer>
		</>
	)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadStripe(): Promise<any> {
	// Dynamically import Stripe.js for web
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const { loadStripe: loadStripeJs } = await import('@stripe/stripe-js')
	const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY

	if (!publishableKey) {
		throw new Error('Missing Stripe publishable key')
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	return loadStripeJs(publishableKey)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
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
	itemsList: {
		gap: theme.spacing.sm,
		marginTop: theme.spacing.sm,
	},
	loadingContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
	},
	payButton: {
		marginTop: theme.spacing.md,
	},
	phoneHint: {
		marginBottom: theme.spacing.sm,
	},
	successContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
		textAlign: 'center',
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
