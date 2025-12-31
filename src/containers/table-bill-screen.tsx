import { Trans, useLingui } from '@lingui/react/macro'
import {
	confirmPlatformPayPayment,
	isPlatformPaySupported as getIsPlatformPaySupported,
	PlatformPay,
	PlatformPayButton,
	useStripe,
} from '@stripe/stripe-react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import PhoneNumberInput from '@/components/phone-number-input'
import ScreenContainer from '@/components/ScreenContainer'
import Text, { H2, H3, Paragraph } from '@/components/Text'
import { trackEvent } from '@/lib/analytics'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { selfQueryOptions } from '@/lib/queries/auth'
import { tableQueryOptions } from '@/lib/queries/tables'
import { api } from '@/lib/services/api-service'
import { formatPrice } from '@/lib/utils/price'

export default function TableBillScreen() {
	const { t } = useLingui()
	const { location_id, table_id } = useLocalSearchParams<{
		location_id: string
		table_id: string
	}>()
	const queryClient = useQueryClient()
	const { presentPaymentSheet } = useStripe()

	const [phoneNumber, setPhoneNumber] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isPlatformPaySupported, setIsPlatformPaySupported] = useState(false)
	const [paymentSuccess, setPaymentSuccess] = useState(false)

	// Check if user is logged in
	const { data: user } = useQuery({
		...selfQueryOptions,
		retry: false,
	})

	// Fetch table bill
	const {
		data: tableBill,
		error,
		isLoading: isBillLoading,
	} = useQuery({
		...tableQueryOptions(location_id, table_id),
		enabled: Boolean(table_id),
	})

	useEffect(() => {
		getIsPlatformPaySupported()
			.then(setIsPlatformPaySupported)
			.catch(() => setIsPlatformPaySupported(false))
	}, [])

	useTrackScreenView(
		{
			bill_total: tableBill?.total ? tableBill.total / 100 : 0,
			item_count:
				tableBill?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
			screenName: 'table-bill',
			skip: !tableBill,
			table_id,
		},
		[tableBill, table_id],
	)

	// Auto-dismiss after successful payment
	useEffect(() => {
		if (paymentSuccess) {
			const timer = setTimeout(() => {
				router.back()
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [paymentSuccess])

	const { mutateAsync: createPaymentIntent } = useMutation({
		mutationFn: () => api.tables.createPaymentIntent(location_id, table_id),
	})

	const handlePlatformPayment = async () => {
		if (!tableBill) return
		if (!user && !phoneNumber) {
			Alert.alert(t`Error`, t`Please provide your phone number to continue`)
			return
		}

		// Track table payment start
		trackEvent('table:payment_start', {
			bill_total: tableBill.total / 100,
			payment_method: Platform.OS === 'ios' ? 'apple_pay' : 'google_pay',
			table_id,
		})

		try {
			setIsLoading(true)

			// Create payment intent
			const { paymentIntent } = await createPaymentIntent()

			// Configure platform pay
			const { error: platformPayError } = await confirmPlatformPayPayment(
				paymentIntent.client_secret,
				Platform.OS === 'ios'
					? {
							applePay: {
								cartItems: [
									{
										amount: (tableBill.total / 100).toString(),
										label: tableBill.tableName,
										paymentType: PlatformPay.PaymentType.Immediate,
									},
								],
								currencyCode: 'MXN',
								merchantCountryCode: 'MX',
							},
						}
					: {
							googlePay: {
								amount: tableBill.total,
								currencyCode: 'MXN',
								label: tableBill.tableName,
								merchantCountryCode: 'MX',
								testEnv: __DEV__,
							},
						},
			)

			if (platformPayError) {
				Alert.alert(t`Error`, platformPayError.message)
				return
			}

			// Mark transaction as paid in Poster
			await api.tables.pay(location_id, table_id, {
				paymentIntentId: paymentIntent.client_secret,
				// oxlint-disable-next-line no-undefined
				phone: !user && phoneNumber ? phoneNumber : undefined,
			})

			// Invalidate queries to refresh wallet/transactions
			await queryClient.invalidateQueries(selfQueryOptions)

			// Show success
			setPaymentSuccess(true)

			if (Platform.OS !== 'web') {
				Burnt.toast({
					from: 'top',
					preset: 'done',
					title: t`Payment successful!`,
				})
			}
		} catch {
			Alert.alert(t`Error`, t`Failed to process payment. Please try again.`)
		} finally {
			setIsLoading(false)
		}
	}

	const handlePaymentSheetPayment = async () => {
		if (!tableBill) return
		if (!user && !phoneNumber) {
			Alert.alert(t`Error`, t`Please provide your phone number to continue`)
			return
		}

		// Track table payment start
		trackEvent('table:payment_start', {
			bill_total: tableBill.total / 100,
			payment_method: 'card',
			table_id,
		})

		try {
			setIsLoading(true)

			// Create payment intent
			const response = await createPaymentIntent()

			const { error: presentError } = await presentPaymentSheet()

			if (presentError) {
				Alert.alert(t`Error`, presentError.message)
				return
			}

			// Mark transaction as paid in Poster
			await api.tables.pay('1', table_id, {
				paymentIntentId: response.paymentIntent.client_secret,
				// oxlint-disable-next-line no-undefined
				phone: !user && phoneNumber ? phoneNumber : undefined,
			})

			// Invalidate queries
			await queryClient.invalidateQueries(selfQueryOptions)

			// Show success
			setPaymentSuccess(true)

			if (Platform.OS !== 'web') {
				Burnt.toast({
					from: 'top',
					preset: 'done',
					title: t`Payment successful!`,
				})
			}
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
									<Text weight="bold">{item.name}</Text>
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
				{isPlatformPaySupported ? (
					<PlatformPayButton
						disabled={isLoading || (!user && !phoneNumber)}
						onPress={handlePlatformPayment}
						style={styles.platformPayButton}
						type={PlatformPay.ButtonType.Pay}
					/>
				) : (
					<Button
						disabled={isLoading || (!user && !phoneNumber)}
						onPress={handlePaymentSheetPayment}
						style={styles.payButton}
					>
						{isLoading ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Trans>Pay {formatPrice(tableBill.total)}</Trans>
						)}
					</Button>
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
	platformPayButton: {
		borderRadius: theme.borderRadius.md,
		height: 50,
		marginTop: theme.spacing.md,
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
