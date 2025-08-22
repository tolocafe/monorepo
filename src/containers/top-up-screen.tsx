import { useEffect, useState } from 'react'
import { Alert, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import {
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
import { ScreenContainer } from '@/components/ScreenContainer'
import { H2, Label, Paragraph, Text } from '@/components/Text'
import { selfQueryOptions } from '@/lib/queries/auth'
import { privateClient } from '@/lib/services/http-client'
import { formatPrice } from '@/lib/utils/price'

// Initialize Stripe
void initStripe({
	merchantIdentifier: 'merchant.cafe.tolo.app',
	publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
	urlScheme: Linking.createURL(''),
})

const TOP_UP_AMOUNTS = [10_000, 20_000, 50_000] as const

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

	const handlePayment = async () => {
		if (!selectedAmount) return

		if (!user) {
			Alert.alert(t`Error`, t`Please sign in to top up your wallet`)
			return
		}

		setIsLoading(true)

		try {
			// Create payment intent
			const paymentData = await createPayment(selectedAmount)

			// Initialize the payment sheet
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

			// Present the payment sheet
			const { error: presentError } = await presentPaymentSheet()

			if (presentError) {
				if (presentError.code !== PaymentSheetError.Canceled) {
					Alert.alert(t`Payment Failed`, presentError.message)
				}
				return
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
			<ScreenContainer contentContainerStyle={styles.container}>
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
					<Trans>Select Amount</Trans>
				</H2>

				<View style={styles.amountGrid}>
					{TOP_UP_AMOUNTS.map((amount) => (
						<View key={amount} style={styles.amountButton}>
							<Button
								disabled={isLoading}
								fullWidth
								onPress={() => handleAmountSelect(amount)}
								textStyle={styles.amountButtonText}
								variant={selectedAmount === amount ? 'primary' : 'surface'}
							>
								{formatPrice(amount)}
							</Button>
						</View>
					))}
				</View>

				{isPlatformPaySupported && (
					<PlatformPayButton
						appearance={PlatformPay.ButtonStyle.Automatic}
						disabled={!selectedAmount || isLoading}
						onPress={handlePayment}
						style={{ height: 40, width: '100%' }}
						type={PlatformPay.ButtonType.TopUp}
					/>
				)}

				<Button
					disabled={!selectedAmount || isLoading}
					fullWidth
					onPress={handlePayment}
					variant="primary"
				>
					{isLoading
						? t`Processing Payment...`
						: t`Pay${selectedAmount ? ` ${formatPrice(selectedAmount)}` : ''}`}
				</Button>

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
		minHeight: 56,
	},
	amountButtonText: {
		fontSize: theme.typography.h4.fontSize,
	},
	amountGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.md,
	},
	balanceAmount: {
		color: theme.colors.primary,
		fontSize: theme.typography.h3.fontSize,
	},
	balanceCard: {
		backgroundColor: theme.colors.surface,
	},
	balanceRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	container: {
		gap: theme.spacing.lg,
		padding: theme.layout.screenPadding,
	},
	description: {
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.md,
	},
	infoCard: {
		backgroundColor: theme.colors.surface,
	},
	infoText: {
		color: theme.colors.textTertiary,
		fontSize: theme.typography.caption.fontSize,
	},
	payButtonContainer: {
		marginTop: theme.spacing.md,
	},
}))
