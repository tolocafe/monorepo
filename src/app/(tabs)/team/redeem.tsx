import { Trans, useLingui } from '@lingui/react/macro'
import { usePreventRemove } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CameraView } from 'expo-camera'
import { Stack } from 'expo-router'
import Head from 'expo-router/head'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import Admonition from '@/components/Admonition'
import Button from '@/components/Button'
import { GreenColorIcon, RedColorIcon } from '@/components/Icons'
import Input from '@/components/Input'
import { TabScreenContainer } from '@/components/ScreenContainer'
import SegmentedControl from '@/components/SegmentedControl'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { useIsBarista } from '@/lib/hooks/use-is-barista'
import {
	redeemClientQueryOptions,
	redeemDrinkMutationOptions,
} from '@/lib/queries/client'
import { formatDate } from '@/lib/utils/format-date'

type DrinkType = 'birthday' | 'visits'

// Check availability of each drink type
// 10 stamps required for a visits redemption
const STAMPS_PER_REDEMPTION = 10

export default function RedeemDrink() {
	const { t } = useLingui()
	const isBarista = useIsBarista()
	const queryClient = useQueryClient()

	const [scannedClientId, setScannedClientId] = useState<null | string>(null)
	const [userSelectedDrinkType, setUserSelectedDrinkType] =
		useState<DrinkType | null>(null)
	const [manualInput, setManualInput] = useState('')
	const [redemptionSuccess, setRedemptionSuccess] = useState(false)

	const {
		data: clientData,
		isError: isClientError,
		isLoading: isLoadingClient,
	} = useQuery(redeemClientQueryOptions(scannedClientId))

	const redeemMutation = useMutation({
		...redeemDrinkMutationOptions,
		onError: (error) => {
			Alert.alert(
				t`Redemption Failed`,
				error instanceof Error ? error.message : t`An error occurred`,
			)
		},
		onSuccess() {
			setRedemptionSuccess(true)

			return queryClient.invalidateQueries({
				queryKey: ['redeem-client', scannedClientId],
			})
		},
	})

	const handleStartScan = useCallback(
		() => CameraView.launchScanner({ barcodeTypes: ['qr'] }),
		[],
	)

	const handleManualSubmit = useCallback(() => {
		if (manualInput.trim()) {
			setScannedClientId(manualInput.trim())
		}
	}, [manualInput])

	const handleReset = useCallback(() => {
		setScannedClientId(null)
		setUserSelectedDrinkType(null)
		setManualInput('')
		setRedemptionSuccess(false)
	}, [])

	// Intercept back navigation when there's a scanned customer
	// Reset state instead of navigating away, allowing barista to scan another customer
	usePreventRemove(Boolean(scannedClientId), () => {
		handleReset()
	})

	// Listen for barcode scans from launchScanner
	useEffect(() => {
		if (Platform.OS === 'web') return

		const subscription = CameraView.onModernBarcodeScanned((event) => {
			if (event.data.startsWith('TOLO-')) {
				const [, customerId] = event.data.split('-')
				setScannedClientId(customerId)
			}
			// Dismiss the scanner on iOS (Android auto-dismisses)
			return CameraView.dismissScanner()
		})

		return () => subscription.remove()
	}, [])

	const hasBirthday = Boolean(clientData?.birthday)
	const stamps = clientData?.stamps ?? 0
	const hasEnoughStamps = stamps >= STAMPS_PER_REDEMPTION
	// Birthday eligibility is determined by the API (one per year, from birthday until redeemed)
	const canRedeemBirthday = clientData?.canRedeemBirthday ?? false
	const canRedeemVisits = hasEnoughStamps

	// Derive selected drink type: user selection takes priority, otherwise auto-select best available
	const selectedDrinkType: DrinkType =
		userSelectedDrinkType ??
		(canRedeemVisits ? 'visits' : canRedeemBirthday ? 'birthday' : 'birthday')

	const handleConfirmRedeem = useCallback(() => {
		if (!scannedClientId) return
		redeemMutation.mutate({
			clientId: scannedClientId,
			type: selectedDrinkType,
		})
	}, [scannedClientId, selectedDrinkType, redeemMutation])

	const clientName = clientData
		? `${clientData.firstname} ${clientData.lastname}`.trim()
		: ''

	if (!isBarista) {
		return (
			<>
				<Head>
					<title>{t`Not Authorized`}</title>
				</Head>
				<TabScreenContainer
					withHeaderPadding
					withTopGradient={Platform.OS !== 'ios'}
				>
					<View style={styles.centered}>
						<H2>
							<Trans>Not Authorized</Trans>
						</H2>
						<Paragraph style={styles.helperText}>
							<Trans>You need barista or owner access to use this tool.</Trans>
						</Paragraph>
					</View>
				</TabScreenContainer>
			</>
		)
	}

	return (
		<>
			<Stack.Screen options={{ title: clientName || t`Redeem` }} />
			<Head>
				<title>{clientName || t`Redeem`}</title>
			</Head>
			<TabScreenContainer
				contentContainerStyle={styles.contentContainer}
				withHeaderPadding
				withTopGradient={Platform.OS !== 'ios'}
			>
				{scannedClientId ? (
					isLoadingClient ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" />
							<Text style={styles.loadingText}>
								<Trans>Loading customer...</Trans>
							</Text>
						</View>
					) : isClientError || !clientData ? (
						<View style={styles.errorContainer}>
							<RedColorIcon name="alert-circle-outline" size={48} />
							<H3>
								<Trans>Customer Not Found</Trans>
							</H3>
							<Paragraph style={styles.errorText}>
								<Trans>
									Could not find a customer with this ID. Please try again.
								</Trans>
							</Paragraph>
							<Button onPress={handleReset} variant="surface">
								<Trans>Try Again</Trans>
							</Button>
						</View>
					) : redemptionSuccess ? (
						<View style={styles.successContainer}>
							<View style={styles.successIconContainer}>
								<GreenColorIcon name="checkmark-circle-outline" size={64} />
							</View>
							<H2>
								<Trans>Redemption Successful!</Trans>
							</H2>
							<Paragraph style={styles.successText}>
								{selectedDrinkType === 'birthday' ? (
									<Trans>
										Birthday drink redeemed for {clientName || 'customer'}.
									</Trans>
								) : (
									<Trans>
										Stamps drink redeemed for {clientName || 'customer'}.
									</Trans>
								)}
							</Paragraph>
						</View>
					) : (
						<View style={styles.redeemContainer}>
							{/* Customer Info */}
							<View style={styles.clientInfo}>
								<Text style={styles.clientMeta}>
									<Trans>
										{clientData.stamps} stamps ({STAMPS_PER_REDEMPTION} = ☕️)
									</Trans>
									{clientData.client_groups_name &&
										` · ${clientData.client_groups_name}`}
								</Text>
								{clientData.birthday && (
									<Text style={styles.clientMeta}>
										{t`Birthday`}: {formatDate(clientData.birthday)}
										{canRedeemBirthday && ` 🎂`}
									</Text>
								)}
							</View>

							<View style={styles.drinkTypeSection}>
								<Text style={styles.sectionLabel}>
									<Trans>Select Redemption</Trans>
								</Text>

								<SegmentedControl
									onChange={setUserSelectedDrinkType}
									value={selectedDrinkType}
								>
									<SegmentedControl.Segment
										disabled={!canRedeemBirthday}
										icon="gift-outline"
										label={<Trans>Birthday</Trans>}
										value="birthday"
									/>
									<SegmentedControl.Segment
										disabled={!canRedeemVisits}
										label={<Trans>Visits</Trans>}
										value="visits"
									/>
								</SegmentedControl>

								{selectedDrinkType === 'birthday' && !canRedeemBirthday && (
									<Admonition>
										{hasBirthday ? (
											<Trans>Birthday drink already redeemed this year.</Trans>
										) : (
											<Trans>No birthday on file.</Trans>
										)}
									</Admonition>
								)}

								{selectedDrinkType === 'visits' && !canRedeemVisits && (
									<Admonition>
										<Trans>
											Not enough stamps. Need {STAMPS_PER_REDEMPTION} stamps for
											a free drink.
										</Trans>
									</Admonition>
								)}
							</View>

							<View style={styles.actions}>
								<Button
									disabled={
										redeemMutation.isPending ||
										(selectedDrinkType === 'birthday' && !canRedeemBirthday) ||
										(selectedDrinkType === 'visits' && !canRedeemVisits)
									}
									onPress={handleConfirmRedeem}
								>
									{redeemMutation.isPending ? (
										<ActivityIndicator color="white" size="small" />
									) : (
										<Trans>Confirm Redemption</Trans>
									)}
								</Button>
							</View>
						</View>
					)
				) : (
					<View style={styles.scanContainer}>
						<Button onPress={handleStartScan}>
							<Trans>Scan Card</Trans>
						</Button>

						{/* Manual input for testing (dev only) */}
						{__DEV__ && (
							<View style={styles.manualInputContainer}>
								<Text style={styles.orText}>
									<Trans>or enter manually</Trans>
								</Text>
								<Input
									autoCapitalize="none"
									autoCorrect={false}
									onChangeText={setManualInput}
									onSubmitEditing={handleManualSubmit}
									placeholder={t`Client ID`}
									returnKeyType="done"
									value={manualInput}
								/>
								<Button
									disabled={!manualInput.trim()}
									onPress={handleManualSubmit}
									variant="surface"
								>
									<Trans>Submit</Trans>
								</Button>
							</View>
						)}
					</View>
				)}
			</TabScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	actions: {
		gap: theme.spacing.sm,
		marginTop: theme.spacing.xl,
	},
	centered: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	clientInfo: {
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
		borderRadius: theme.borderRadius.lg,
		borderWidth: 1,
		gap: theme.spacing.xs,
		padding: theme.spacing.lg,
	},
	clientMeta: {
		color: theme.colors.crema.solid,
		fontSize: theme.fontSizes.sm,
	},
	contentContainer: {
		gap: theme.spacing.xs,
	},
	drinkTypeSection: {
		gap: theme.spacing.md,
		marginTop: theme.spacing.xl,
	},
	errorContainer: {
		alignItems: 'center',
		gap: theme.spacing.md,
		marginTop: theme.spacing.xxl,
		paddingHorizontal: theme.spacing.lg,
	},
	errorText: {
		color: theme.colors.crema.solid,
		textAlign: 'center',
	},
	helperText: {
		color: theme.colors.crema.solid,
	},
	loadingContainer: {
		alignItems: 'center',
		gap: theme.spacing.md,
		marginTop: theme.spacing.xxl,
	},
	loadingText: {
		color: theme.colors.crema.solid,
	},
	manualInputContainer: {
		gap: theme.spacing.md,
		marginTop: theme.spacing.lg,
	},
	orText: {
		color: theme.colors.crema.solid,
		textAlign: 'center',
	},
	redeemContainer: {
		flex: 1,
	},
	scanContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	sectionLabel: {
		color: theme.colors.crema.solid,
		fontSize: theme.fontSizes.sm,
	},
	successContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	successIconContainer: {
		marginBottom: theme.spacing.md,
	},
	successText: {
		color: theme.colors.crema.solid,
		textAlign: 'center',
	},
}))
