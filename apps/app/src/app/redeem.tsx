import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import Button from '@/components/Button'
import { GreenColorIcon } from '@/components/Icons'
import { Input } from '@/components/Input'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { selfQueryOptions } from '@/lib/queries/auth'
import {
	promoCodePreviewQueryOptions,
	redeemPromoCodeMutationOptions,
} from '@/lib/queries/promo-codes'

function formatCodeInput(raw: string) {
	const clean = raw
		.replace(/[^A-NP-Za-np-z1-9]/g, '')
		.toUpperCase()
		.slice(0, 6)
	if (clean.length > 3) {
		return `${clean.slice(0, 3)}-${clean.slice(3)}`
	}
	return clean
}

export default function RedeemScreen() {
	const { t } = useLingui()
	const queryClient = useQueryClient()
	const params = useLocalSearchParams<{ code?: string }>()

	const { data: self } = useQuery(selfQueryOptions)

	const [codeInput, setCodeInput] = useState('')
	const [submittedCode, setSubmittedCode] = useState<null | string>(null)
	const [redeemSuccess, setRedeemSuccess] = useState(false)
	const [redeemedAmount, setRedeemedAmount] = useState(0)

	// Pre-populate from deep link query param
	useEffect(() => {
		if (params.code) {
			setCodeInput(formatCodeInput(params.code))
		}
	}, [params.code])

	const rawCode = codeInput.replace(/-/g, '')
	const isValidLength = rawCode.length === 6

	const {
		data: preview,
		isError: isPreviewError,
		isLoading: isLoadingPreview,
	} = useQuery(promoCodePreviewQueryOptions(submittedCode))

	const redeemMutation = useMutation({
		...redeemPromoCodeMutationOptions,
		onError: (error) => {
			Alert.alert(
				t`Redemption Failed`,
				error instanceof Error ? error.message : t`An error occurred`,
			)
		},
		onSuccess(data) {
			setRedeemedAmount(data.amount)
			setRedeemSuccess(true)
			void queryClient.invalidateQueries({
				queryKey: selfQueryOptions.queryKey,
			})
		},
	})

	const handleCodeChange = useCallback((text: string) => {
		setCodeInput(formatCodeInput(text))
		setSubmittedCode(null)
	}, [])

	const handleLookup = useCallback(() => {
		if (!self) {
			router.push('/sign-in')
			return
		}
		if (isValidLength) {
			setSubmittedCode(codeInput)
		}
	}, [self, isValidLength, codeInput])

	const handleRedeem = useCallback(() => {
		if (!self) {
			router.push('/sign-in')
			return
		}
		if (submittedCode) {
			redeemMutation.mutate(submittedCode)
		}
	}, [self, submittedCode, redeemMutation])

	const handleDone = useCallback(() => {
		router.back()
	}, [])

	if (redeemSuccess) {
		return (
			<>
				<Stack.Screen.Title>{t`Redeemed`}</Stack.Screen.Title>
				<Head>
					<title>{t`Promo Code Redeemed`}</title>
				</Head>
				<ScreenContainer contentContainerStyle={styles.contentContainer}>
					<View style={styles.successContainer}>
						<GreenColorIcon name="checkmark-circle-outline" size={64} />
						<H2>
							<Trans>Code Redeemed!</Trans>
						</H2>
						<Paragraph style={styles.successText}>
							<Trans>
								${(redeemedAmount / 100).toLocaleString()} MXN has been added to
								your wallet.
							</Trans>
						</Paragraph>
						<Button onPress={handleDone}>
							<Trans>Done</Trans>
						</Button>
					</View>
				</ScreenContainer>
			</>
		)
	}

	return (
		<>
			<Stack.Screen.Title>{t`Redeem`}</Stack.Screen.Title>
			<Head>
				<title>{t`Redeem Promo Code`}</title>
			</Head>
			<ScreenContainer contentContainerStyle={styles.contentContainer}>
				<View style={styles.inputSection}>
					<Text style={styles.label}>
						<Trans>Enter Promo Code</Trans>
					</Text>
					<Input
						autoCapitalize="characters"
						autoCorrect={false}
						onChangeText={handleCodeChange}
						onSubmitEditing={handleLookup}
						placeholder="ABC-DEF"
						returnKeyType="done"
						value={codeInput}
					/>
					{!submittedCode && (
						<Button
							disabled={!isValidLength}
							onPress={handleLookup}
							variant="surface"
						>
							<Trans>Look Up</Trans>
						</Button>
					)}
				</View>

				{submittedCode && (
					<View style={styles.previewSection}>
						{isLoadingPreview ? (
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="large" />
							</View>
						) : isPreviewError || !preview ? (
							<View style={styles.errorContainer}>
								<H3>
									<Trans>Code Not Found</Trans>
								</H3>
								<Paragraph style={styles.errorText}>
									<Trans>
										This promo code does not exist. Please check and try again.
									</Trans>
								</Paragraph>
							</View>
						) : preview.isRedeemed ? (
							<View style={styles.errorContainer}>
								<H3>
									<Trans>Already Redeemed</Trans>
								</H3>
								<Paragraph style={styles.errorText}>
									<Trans>This promo code has already been used.</Trans>
								</Paragraph>
							</View>
						) : (
							<View style={styles.redeemSection}>
								<View style={styles.amountCard}>
									<Text style={styles.amountLabel}>
										<Trans>Amount</Trans>
									</Text>
									<Text style={styles.amountValue}>
										${(preview.amount / 100).toLocaleString()} MXN
									</Text>
								</View>
								<Button
									disabled={redeemMutation.isPending}
									onPress={handleRedeem}
								>
									{redeemMutation.isPending ? (
										<ActivityIndicator color="white" size="small" />
									) : (
										<Trans>Redeem to Wallet</Trans>
									)}
								</Button>
							</View>
						)}
					</View>
				)}
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	amountCard: {
		alignItems: 'center',
		backgroundColor: theme.colors.primary.background,
		borderColor: theme.colors.primary.border,
		borderRadius: theme.borderRadius.lg,
		borderWidth: 1,
		gap: theme.spacing.xs,
		padding: theme.spacing.xl,
	},
	amountLabel: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.sm,
	},
	amountValue: {
		color: theme.colors.primary.solid,
		fontSize: theme.fontSizes.xxl,
		fontWeight: theme.fontWeights.bold,
	},
	contentContainer: {
		gap: theme.spacing.md,
	},
	errorContainer: {
		alignItems: 'center',
		gap: theme.spacing.md,
		paddingVertical: theme.spacing.xl,
	},
	errorText: {
		color: theme.colors.gray.solid,
		textAlign: 'center',
	},
	inputSection: {
		gap: theme.spacing.md,
	},
	label: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.sm,
	},
	loadingContainer: {
		alignItems: 'center',
		paddingVertical: theme.spacing.xxl,
	},
	previewSection: {
		marginTop: theme.spacing.md,
	},
	redeemSection: {
		gap: theme.spacing.lg,
	},
	successContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.lg,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	successText: {
		color: theme.colors.gray.solid,
		textAlign: 'center',
	},
}))
