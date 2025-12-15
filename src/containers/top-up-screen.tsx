import { useEffect, useState } from 'react'
import { Alert, Platform, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import {
	confirmPlatformPayPayment,
	isPlatformPaySupported as getIsPlatformPaySupported,
	initStripe,
	PaymentSheetError,
	PlatformPay,
	PlatformPayButton,
	useStripe,
} from '@stripe/stripe-react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { CheckedButton } from '@/components/CheckedButton'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Label, Paragraph, Text } from '@/components/Text'
import { selfQueryOptions } from '@/lib/queries/auth'
import { privateClient } from '@/lib/services/http-client'
import { formatPrice } from '@/lib/utils/price'

void initStripe({
	merchantIdentifier: 'merchant.cafe.tolo.app',
	publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
	urlScheme: Linking.createURL(''),
})

const TOP_UP_AMOUNTS = [10_000, 20_000, 50_000] as const

const commonPlatformPayOptions = {
	currencyCode: 'MXN',
	merchantCountryCode: 'MX',
}

export default function TopUpScreen() {
	const { t } = useLingui()
	const { initPaymentSheet, presentPaymentSheet } = useStripe()
	const queryClient = useQueryClient()
	const [selectedAmount, setSelectedAmount] = useState<null | number>(
		TOP_UP_AMOUNTS[1],
	)
	const [isLoading, setIsLoading] = useState(false)
	const [isPlatformPaySupported, setIsPlatformPaySupported] = useState(false)

	const { data: user } = useQuery(selfQueryOptions)

	const { mutateAsync: createPayment } = useMutation({
		async mutationFn(amount: number) {
			const response = await privateClient
				.post('transactions/payment-intent', { json: { amount } })
				.json<{
					ephemeralKey: { secret: string }
					paymentIntent: { client_secret: string; customer: string }
				}>()

			return response
		},
	})

	useEffect(() => {
		void getIsPlatformPaySupported().then(setIsPlatformPaySupported)
	}, [])

	const handleAmountSelect = (amount: number) => {
		setSelectedAmount(amount)
	}

	const handlePayment = async (isPlatformPay: boolean) => {
		if (!selectedAmount) return

		if (!user) {
			Alert.alert(t`Error`, t`Please sign in to top up your wallet`)
			return
		}

		setIsLoading(true)

		try {
			// Create payment intent
			const paymentData = await createPayment(selectedAmount)

			const { error: initError } = await initPaymentSheet({
				allowsDelayedPaymentMethods: true,
				customerEphemeralKeySecret: paymentData.ephemeralKey.secret,
				customerId: paymentData.paymentIntent.customer,
				defaultBillingDetails: {
					email: user.email,
					name: user.name || `${user.firstname} ${user.lastname}`.trim(),
					phone: user.phone,
				},
				merchantDisplayName: 'TOLO - Buen Café',
				paymentIntentClientSecret: paymentData.paymentIntent.client_secret,
			})

			if (initError) {
				Alert.alert(t`Error`, initError.message)
				return
			}

			if (isPlatformPay) {
				const { error: presentError } = await confirmPlatformPayPayment(
					paymentData.paymentIntent.client_secret,
					Platform.OS === 'ios'
						? {
								applePay: {
									cartItems: [
										{
											amount: (selectedAmount / 100).toString(),
											label: 'TOLO',
											paymentType: PlatformPay.PaymentType.Immediate,
										},
									],
									...commonPlatformPayOptions,
								},
							}
						: {
								googlePay: {
									amount: selectedAmount,
									label: 'TOLO',
									testEnv: false,
									...commonPlatformPayOptions,
								},
							},
				)

				if (presentError) {
					Alert.alert(t`Error`, presentError.message)
					return
				}
			} else {
				// Present the payment sheet
				const { error: presentError } = await presentPaymentSheet()

				if (presentError) {
					if (presentError.code !== PaymentSheetError.Canceled) {
						Alert.alert(t`Payment Failed`, presentError.message)
					}
					return
				}
			}

			// Payment succeeded
			Burnt.toast({
				duration: 3,
				haptic: 'success',
				message: t`Your wallet has been topped up successfully!`,
				preset: 'done',
				title: t`Payment Successful`,
			})

			// Refresh user data to show updated balance
			await queryClient.invalidateQueries(selfQueryOptions)

			// Navigate back
			if (router.canGoBack()) {
				router.back()
			} else {
				router.navigate('/more')
			}
		} catch (error) {
			Alert.alert(
				t`Error`,
				error instanceof Error
					? error.message
					: t`Failed to process payment. Please try again.`,
			)
		} finally {
			setIsLoading(false)
		}
	}

	const balanceCents = Number(user?.ewallet ?? '0')
	const balance = balanceCents.toFixed(2)

	return (
		<>
			<Head>
				<title>{t`Top Up - TOLO`}</title>
				<meta
					content={t`Add funds to your TOLO wallet for quick and easy payments.`}
					name="description"
				/>
				<meta content={t`Top Up - TOLO`} property="og:title" />
				<meta content="/more/top-up" property="og:url" />
			</Head>
			<ScreenContainer
				contentContainerStyle={styles.contentContainer}
				withHeaderPadding
			>
				<H2>
					<Trans>Current Balance</Trans>
				</H2>

				<Card style={styles.balanceCard}>
					<View style={styles.balanceRow}>
						<Label>
							<Trans>Wallet Balance</Trans>
						</Label>
						<Text style={styles.balanceAmount} weight="bold">
							{formatPrice(balance)}
						</Text>
					</View>
				</Card>

				<H2>
					<Trans>Amount</Trans>
				</H2>

				<View style={styles.amountGrid}>
					{TOP_UP_AMOUNTS.map((amount) => (
						<CheckedButton
							accessibilityRole="radio"
							checked={selectedAmount === amount}
							disabled={isLoading}
							key={amount}
							onPress={() => handleAmountSelect(amount)}
							style={styles.amountButton}
							textStyle={styles.amountButtonText}
						>
							{formatPrice(amount)}
						</CheckedButton>
					))}
				</View>

				<H2>
					<Trans>Method</Trans>
				</H2>
				<View style={{ flexDirection: 'row', gap: 10 }}>
					{isPlatformPaySupported && (
						<PlatformPayButton
							appearance={PlatformPay.ButtonStyle.Automatic}
							borderRadius={40}
							disabled={!selectedAmount || isLoading}
							onPress={() => handlePayment(true)}
							style={{ flex: 1 }}
							type={PlatformPay.ButtonType.TopUp}
						/>
					)}

					<Button
						disabled={!selectedAmount || isLoading}
						onPress={() => handlePayment(false)}
						variant="primary"
					>
						{isLoading ? t`Processing Payment...` : t`Top Up With Card`}
					</Button>
				</View>

				<Paragraph style={styles.infoText}>
					<Trans>
						💳 Secure payments powered by Stripe
						{'\n'}
						🔒 Your payment information is encrypted and secure
					</Trans>
				</Paragraph>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	amountButton: {
		flex: 1,
	},
	amountButtonText: {
		fontSize: theme.fontSizes.lg,
	},
	amountGrid: {
		flexDirection: 'row',
		gap: theme.spacing.xs,
	},
	balanceAmount: {
		color: theme.colors.verde.solid,
		fontSize: theme.typography.h3.fontSize,
		paddingVertical: theme.spacing.xs,
	},
	balanceCard: {
		backgroundColor: theme.colors.gray.background,
	},
	balanceRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	contentContainer: {
		gap: theme.spacing.md,
	},
	infoText: {
		color: theme.colors.gray.solid,
		fontSize: theme.typography.caption.fontSize,
		padding: theme.spacing.lg,
	},
}))
