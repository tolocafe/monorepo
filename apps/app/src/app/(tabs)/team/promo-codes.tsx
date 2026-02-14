import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import Head from 'expo-router/head'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import Button from '@/components/Button'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Paragraph, Text } from '@/components/Text'
import { useIsTeamMember } from '@/lib/hooks/use-is-barista'
import { createPromoCodeMutationOptions } from '@/lib/queries/promo-codes'

const PRESET_AMOUNTS = [
	{ centavos: 10_000, label: '$100' },
	{ centavos: 20_000, label: '$200' },
	{ centavos: 50_000, label: '$500' },
	{ centavos: 100_000, label: '$1,000' },
] as const

export default function PromoCodesScreen() {
	const { t } = useLingui()
	const isTeamMember = useIsTeamMember()
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
	const [createdCode, setCreatedCode] = useState<{
		amount: number
		code: string
	} | null>(null)

	const createMutation = useMutation({
		...createPromoCodeMutationOptions,
		onError: (error) => {
			Alert.alert(
				t`Error`,
				error instanceof Error ? error.message : t`Failed to create promo code`,
			)
		},
		onSuccess(data) {
			setCreatedCode({ amount: data.amount, code: data.code })
		},
	})

	const handleCreate = useCallback(() => {
		if (!selectedAmount) return
		createMutation.mutate({ amount: selectedAmount })
	}, [selectedAmount, createMutation])

	const handleReset = useCallback(() => {
		setSelectedAmount(null)
		setCreatedCode(null)
	}, [])

	if (!isTeamMember) {
		return (
			<>
				<Head>
					<title>{t`Not Authorized`}</title>
				</Head>
				<ScreenContainer>
					<View style={styles.centered}>
						<H2>
							<Trans>Not Authorized</Trans>
						</H2>
						<Paragraph style={styles.helperText}>
							<Trans>You need barista or owner access to use this tool.</Trans>
						</Paragraph>
					</View>
				</ScreenContainer>
			</>
		)
	}

	if (createdCode) {
		return (
			<>
				<Stack.Screen.Title>{t`Promo Code`}</Stack.Screen.Title>
				<Head>
					<title>{t`Promo Code Created`}</title>
				</Head>
				<ScreenContainer contentContainerStyle={styles.contentContainer}>
					<View style={styles.resultContainer}>
						<Text style={styles.resultLabel}>
							<Trans>Promo Code</Trans>
						</Text>
						<Text style={styles.codeDisplay}>{createdCode.code}</Text>
						<Text style={styles.amountDisplay}>
							${(createdCode.amount / 100).toLocaleString()} MXN
						</Text>
						<View style={styles.qrContainer}>
							<Text style={styles.qrUrl}>
								app.tolo.cafe/redeem?code={createdCode.code}
							</Text>
						</View>
						<Button onPress={handleReset} variant="surface">
							<Trans>Create Another</Trans>
						</Button>
					</View>
				</ScreenContainer>
			</>
		)
	}

	return (
		<>
			<Stack.Screen.Title>{t`Promo Codes`}</Stack.Screen.Title>
			<Head>
				<title>{t`Promo Codes`}</title>
			</Head>
			<ScreenContainer contentContainerStyle={styles.contentContainer}>
				<Text style={styles.sectionLabel}>
					<Trans>Select Amount</Trans>
				</Text>

				<View style={styles.amountGrid}>
					{PRESET_AMOUNTS.map((preset) => (
						<Pressable
							key={preset.centavos}
							onPress={() => setSelectedAmount(preset.centavos)}
							style={[
								styles.amountButton,
								selectedAmount === preset.centavos &&
									styles.amountButtonSelected,
							]}
						>
							<Text
								style={[
									styles.amountButtonText,
									selectedAmount === preset.centavos &&
										styles.amountButtonTextSelected,
								]}
							>
								{preset.label}
							</Text>
						</Pressable>
					))}
				</View>

				<View style={styles.actions}>
					<Button
						disabled={!selectedAmount || createMutation.isPending}
						onPress={handleCreate}
					>
						{createMutation.isPending ? (
							<ActivityIndicator color="white" size="small" />
						) : (
							<Trans>Create Promo Code</Trans>
						)}
					</Button>
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	actions: {
		marginTop: theme.spacing.xl,
	},
	amountButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
		borderRadius: theme.borderRadius.lg,
		borderWidth: 1,
		flex: 1,
		minWidth: '45%',
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.xl,
	},
	amountButtonSelected: {
		backgroundColor: theme.colors.primary.background,
		borderColor: theme.colors.primary.border,
	},
	amountButtonText: {
		color: theme.colors.gray.text,
		fontSize: theme.fontSizes.xl,
		fontWeight: theme.fontWeights.semibold,
	},
	amountButtonTextSelected: {
		color: theme.colors.primary.solid,
	},
	amountDisplay: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.lg,
		textAlign: 'center',
	},
	amountGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.md,
	},
	centered: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	codeDisplay: {
		fontSize: theme.fontSizes.xxxl,
		fontWeight: theme.fontWeights.bold,
		letterSpacing: 4,
		textAlign: 'center',
	},
	contentContainer: {
		gap: theme.spacing.md,
	},
	helperText: {
		color: theme.colors.gray.solid,
	},
	qrContainer: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
		borderRadius: theme.borderRadius.lg,
		borderWidth: 1,
		padding: theme.spacing.lg,
	},
	qrUrl: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.xs,
		textAlign: 'center',
	},
	resultContainer: {
		alignItems: 'center',
		gap: theme.spacing.lg,
		paddingTop: theme.spacing.xxl,
	},
	resultLabel: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.sm,
	},
	sectionLabel: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.sm,
	},
}))
