import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { PaymentSheetError, useStripe } from '@stripe/stripe-react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import * as Burnt from 'burnt'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ScreenContainer } from '@/components/ScreenContainer'
import { H2, Paragraph, Text } from '@/components/Text'
import { selfQueryOptions } from '@/lib/queries/auth'
import { topUpEWalletMutationOptions } from '@/lib/queries/wallet'
import { queryClient } from '@/lib/query-client'
import { formatPrice } from '@/lib/utils/price'

const PRESET_AMOUNTS = [1000, 2000, 5000, 10_000] // in cents

export default function TopUp() {
	const { t } = useLingui()
	const { data: user } = useQuery(selfQueryOptions)
	const { initPaymentSheet, presentPaymentSheet } = useStripe()
	const [selectedAmount, setSelectedAmount] = useState<number>(2000)

	const { isPending, mutateAsync: topUpWallet } = useMutation({
		...topUpEWalletMutationOptions,
		onError(error) {
			Burnt.toast({
				duration: 3,
				haptic: 'error',
				message:
					error instanceof Error
						? error.message
						: t`Failed to top up wallet. Please try again.`,
				preset: 'error',
				title: t`Error`,
			})
		},
		async onSuccess() {
			// Invalidate user query to refresh balance
			await queryClient.invalidateQueries({ queryKey: ['auth', 'self'] })
			Burnt.toast({
				duration: 3,
				haptic: 'success',
				message: t`Your wallet has been topped up successfully!`,
				preset: 'done',
				title: t`Success`,
			})
			router.back()
		},
	})

	const handleTopUp = async () => {
		try {
			const { ephemeralKey, paymentIntent } = await topUpWallet({
				amount: selectedAmount,
			})

			const { error: initError } = await initPaymentSheet({
				allowsDelayedPaymentMethods: false,
				customerEphemeralKeySecret: ephemeralKey,
				merchantDisplayName: 'TOLO - Buen Café',
				paymentIntentClientSecret: paymentIntent.client_secret,
				returnURL: 'tolo://more/top-up',
			})

			if (initError) {
				throw new Error(initError.message)
			}

			const { error: presentError } = await presentPaymentSheet()
			if (presentError) {
				// User cancelled or error occurred
				if (presentError.code !== PaymentSheetError.Canceled) {
					throw new Error(presentError.message)
				}
				return
			}

			// Payment successful - the onSuccess callback will handle the rest
		} catch (error) {
			Burnt.toast({
				duration: 3,
				haptic: 'error',
				message:
					error instanceof Error
						? error.message
						: t`Failed to process payment. Please try again.`,
				preset: 'error',
				title: t`Error`,
			})
		}
	}

	const currentBalance = Number(user?.ewallet ?? '0')

	return (
		<>
			<Head>
				<title>{t`Top Up Wallet`}</title>
			</Head>
			<ScreenContainer>
				<View style={styles.container}>
					{/* Current Balance */}
					<Card style={styles.balanceCard}>
						<Paragraph style={styles.balanceLabel}>
							<Trans>Current Balance</Trans>
						</Paragraph>
						<Text style={styles.balanceValue}>
							{formatPrice(currentBalance)}
						</Text>
					</Card>

					{/* Amount Selection */}
					<View style={styles.section}>
						<H2 style={styles.sectionTitle}>
							<Trans>Select Amount</Trans>
						</H2>
						<View style={styles.amountGrid}>
							{PRESET_AMOUNTS.map((amount) => (
								<TouchableOpacity
									key={amount}
									onPress={() => setSelectedAmount(amount)}
									style={[
										styles.amountButton,
										selectedAmount === amount && styles.amountButtonSelected,
									]}
								>
									<Text
										style={[
											styles.amountText,
											selectedAmount === amount && styles.amountTextSelected,
										]}
									>
										{formatPrice(amount)}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Preview */}
					<Card style={styles.previewCard}>
						<View style={styles.previewRow}>
							<Paragraph style={styles.previewLabel}>
								<Trans>Amount to add</Trans>
							</Paragraph>
							<Paragraph style={styles.previewValue}>
								{formatPrice(selectedAmount)}
							</Paragraph>
						</View>
						<View style={styles.divider} />
						<View style={styles.previewRow}>
							<Paragraph style={styles.previewLabel}>
								<Trans>New balance</Trans>
							</Paragraph>
							<Text style={styles.balanceValueNew}>
								{formatPrice(currentBalance + selectedAmount)}
							</Text>
						</View>
					</Card>

					{/* Payment Info */}
					<Card style={styles.infoCard}>
						<View style={styles.infoRow}>
							<Ionicons
								color={styles.infoIcon.color}
								name="card-outline"
								size={20}
							/>
							<Paragraph style={styles.infoText}>
								<Trans>
									Payment will be processed securely through Stripe. Your card
									details are never stored on our servers.
								</Trans>
							</Paragraph>
						</View>
					</Card>

					{/* Action Button */}
					<View style={styles.buttonContainer}>
						<Button disabled={isPending} fullWidth onPress={handleTopUp}>
							{isPending ? (
								<Trans>Processing...</Trans>
							) : (
								<Trans>Add Funds</Trans>
							)}
						</Button>
					</View>
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	amountButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		flex: 1,
		justifyContent: 'center',
		margin: theme.spacing.xs,
		minWidth: '45%',
		paddingVertical: theme.spacing.lg,
	},
	amountButtonSelected: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	amountGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -theme.spacing.xs,
	},
	amountText: {
		color: theme.colors.text,
		fontSize: theme.fontSizes.lg,
		fontWeight: theme.fontWeights.medium,
	},
	amountTextSelected: {
		color: theme.colors.surface,
	},
	balanceCard: {
		alignItems: 'center',
		marginBottom: theme.spacing.xl,
		paddingVertical: theme.spacing.lg,
	},
	balanceLabel: {
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
	},
	balanceValue: {
		color: theme.colors.primary,
		fontSize: theme.fontSizes.xxl,
		fontWeight: theme.fontWeights.bold,
	},
	balanceValueNew: {
		color: theme.colors.primary,
		fontWeight: theme.fontWeights.semibold,
	},
	buttonContainer: {
		marginTop: 'auto',
		paddingTop: theme.spacing.lg,
	},
	container: {
		flex: 1,
		padding: theme.layout.screenPadding,
	},
	divider: {
		backgroundColor: theme.colors.border,
		height: 1,
		marginVertical: theme.spacing.sm,
	},
	infoCard: {
		marginTop: theme.spacing.md,
	},
	infoIcon: {
		color: theme.colors.textSecondary,
	},
	infoRow: {
		alignItems: 'flex-start',
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	infoText: {
		color: theme.colors.textSecondary,
		flex: 1,
		fontSize: theme.fontSizes.sm,
		lineHeight: 20,
	},
	previewCard: {
		marginTop: theme.spacing.lg,
	},
	previewLabel: {
		color: theme.colors.textSecondary,
	},
	previewRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	previewValue: {
		fontWeight: theme.fontWeights.medium,
	},
	section: {
		marginBottom: theme.spacing.xl,
	},
	sectionTitle: {
		marginBottom: theme.spacing.md,
	},
}))
