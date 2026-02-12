import '@/lib/styles/unistyles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { captureException } from '@sentry/react-native'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'
import { z } from 'zod/v4'

import Button from '@/components/Button'
import Input from '@/components/Input'
import OtpInput from '@/components/otp-input'
import PhoneNumberInput from '@/components/phone-number-input'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Label, Paragraph, Text } from '@/components/Text'
import { identify } from '@/lib/analytics'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { requestTrackingPermissionAsync } from '@/lib/notifications'
import {
	requestOtpMutationOptions,
	verifyOtpMutationOptions,
} from '@/lib/queries/auth'
import { formatPhoneNumber } from '@/lib/utils/phone'

const SignInSchema = z.object({
	birthdate: z.string().trim(),
	name: z.string().trim(),
	phoneNumber: z.string().trim().min(1, 'Please enter a phone number'),
	verificationCode: z
		.string()
		.trim()
		.min(1, 'Please enter a verification code')
		.max(6, 'The code must be 6 digits')
		.or(z.literal('')),
})

const handleClose = () => {
	router.back()
}

const TextIonicons = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.text,
}))

export default function SignInScreen() {
	const { t } = useLingui()
	const { itemName } = useLocalSearchParams<{ itemName?: string }>()
	const [stage, setStage] = useState<'code' | 'phone' | 'signup'>('phone')
	const [_requiredFields, setRequiredFields] = useState<string[]>([])
	const [retryCount, setRetryCount] = useState(0)
	const queryClient = useQueryClient()

	const requestOtpMutation = useMutation(requestOtpMutationOptions)
	const verifyOtpMutation = useMutation({
		...verifyOtpMutationOptions,
		async onSuccess(data) {
			await queryClient.invalidateQueries({ queryKey: ['self'] })

			// Note: auth:user_login is now tracked on the backend
			requestTrackingPermissionAsync()
				.then((granted) => {
					if (granted) {
						return identify({
							birthdate: data.client.birthday,
							email: data.client.email,
							firstName: data.client.firstname,
							lastName: data.client.lastname,
							phoneNumber: data.client.phone_number,
							userId: data.client.client_id,
						})
					}

					return null
				})
				.catch(captureException)

			router.replace('/')
		},
	})

	useTrackScreenView(
		{ has_item_context: Boolean(itemName), screenName: 'sign-in' },
		[itemName],
	)

	const { Field, handleSubmit, resetField, Subscribe } = useForm({
		defaultValues: {
			birthdate: '',
			name: '',
			phoneNumber: '',
			verificationCode: '',
		},
		async onSubmit({ value }) {
			try {
				if (stage === 'phone') {
					await requestOtpMutation.mutateAsync({
						phone: value.phoneNumber.trim(),
					})
					setRetryCount(0)
					setStage('code')
					resetField('verificationCode')

					Burnt.toast({
						duration: 2,
						haptic: 'success',
						message: t`We sent you a 6-digit code`,
						preset: 'done',
						title: t`Code sent`,
					})
					return
				}

				if (stage === 'signup') {
					await requestOtpMutation.mutateAsync({
						birthdate: value.birthdate.trim(),
						name: value.name.trim(),
						phone: value.phoneNumber.trim(),
					})

					setRetryCount(0)
					setStage('code')
					resetField('verificationCode')

					Burnt.toast({
						duration: 2,
						haptic: 'success',
						message: t`We sent you a 6-digit code`,
						preset: 'done',
						title: t`Code sent`,
					})
					return
				}

				await verifyOtpMutation.mutateAsync({
					code: value.verificationCode.trim(),
					phone: value.phoneNumber.trim(),
					sessionName: Platform.OS,
				})
				setRetryCount(0)
			} catch (error: unknown) {
				// Check if it's an HTTP error with status code
				const httpError = error as {
					response?: {
						json?: () => Promise<{
							error?: string
							fields?: { name: string }[]
						}>
						status?: number
					}
				}

				const statusCode = httpError.response?.status

				// Handle 500 errors with retry logic
				if (statusCode === 500) {
					captureException(error, {
						extra: {
							retryCount,
							stage,
							statusCode,
						},
						tags: {
							feature: 'auth',
							operation: stage === 'code' ? 'verifyOtp' : 'requestOtp',
						},
					})

					const canRetry = retryCount < 2
					if (canRetry) {
						setRetryCount((count) => count + 1)
						Burnt.toast({
							duration: 4,
							haptic: 'warning',
							message: t`Something went wrong. Please try again.`,
							preset: 'error',
							title: t`Server Error`,
						})
						return
					}

					// Max retries reached
					Burnt.toast({
						duration: 5,
						haptic: 'error',
						message: t`We're experiencing technical difficulties. Please try again later.`,
						preset: 'error',
						title: t`Service Unavailable`,
					})

					if (stage === 'code') {
						resetField('verificationCode')
					}
					return
				}

				// Reset retry count on non-500 errors
				setRetryCount(0)

				// Check if it's a validation error requiring name/birthdate
				if (stage === 'phone') {
					try {
						const errorData = await httpError.response?.json?.()
						if (
							errorData?.error === 'Some fields are required' &&
							errorData.fields
						) {
							const missingFields = errorData.fields.map((f) => f.name)
							setRequiredFields(missingFields)
							setStage('signup')
							return
						}
					} catch {
						// Fall through to regular error handling
					}
				}

				// Handle verification code errors
				if (stage === 'code') {
					resetField('verificationCode')
					Burnt.toast({
						duration: 3,
						haptic: 'error',
						message: (error as Error).message || t`Invalid verification code`,
						preset: 'error',
						title: t`Error`,
					})
					return
				}

				// Handle phone/signup errors
				Burnt.toast({
					duration: 3,
					haptic: 'error',
					message: (error as Error).message || t`Failed to send code`,
					preset: 'error',
					title: t`Error`,
				})
			}
		},
		validators: { onChange: SignInSchema },
	})

	const handleGoBack = useCallback(() => {
		setRetryCount(0)
		if (stage === 'signup') {
			setStage('phone')
			setRequiredFields([])
		} else if (stage === 'code') {
			setStage('phone')
			resetField('verificationCode')
		} else {
			router.back()
		}
	}, [stage, setRequiredFields, resetField])

	// Handle Esc key press on web to go back
	useEffect(() => {
		if (Platform.OS !== 'web') return

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handleGoBack()
			}
		}

		globalThis.addEventListener('keydown', handleKeyDown)

		return () => {
			globalThis.removeEventListener('keydown', handleKeyDown)
		}
	}, [handleGoBack])

	return (
		<>
			{/* <Stack.Screen
				options={{
					animation: Platform.select({ web: 'fade' }),
					headerBackVisible: false,
					headerRight: () => (
						<Pressable
							accessibilityLabel={t`Close`}
							accessibilityRole="button"
							onPress={() => router.back()}
						>
							<TextColorIcon name="close" size={28} />
						</Pressable>
					),
					headerShadowVisible: false,
					headerShown: Platform.OS !== 'web',
					headerTitle: '',
					headerTransparent: true,
					presentation: Platform.select({
						default: 'modal',
						web: 'transparentModal',
					}),
				}}
			/> */}
			<Stack.Screen.Title>{t`Sign in`}</Stack.Screen.Title>
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Button icon="xmark" onPress={handleClose} />
			</Stack.Toolbar>
			<ScreenContainer
				bounces={false}
				contentContainerStyle={styles.contentContainer}
				keyboardAware
				style={styles.container}
			>
				{Platform.OS === 'web' && (
					<View style={styles.header}>
						<Pressable onPress={() => router.back()}>
							<TextIonicons name="close" size={30} />
						</Pressable>
					</View>
				)}

				{itemName && (
					<View style={styles.messageContainer}>
						<Paragraph style={styles.message}>
							<Trans>Sign in to add &ldquo;{itemName}&rdquo; to your bag</Trans>
						</Paragraph>
					</View>
				)}

				{stage === 'phone' ? (
					<>
						<H2>
							<Trans>Welcome</Trans>
						</H2>
						<Paragraph>
							<Trans>
								Enter to your account or create a new one using your phone
								number
							</Trans>
						</Paragraph>

						<View style={styles.inputContainer}>
							<Label style={styles.label}>
								<Trans>Phone number</Trans>
							</Label>
							<Field name="phoneNumber">
								{(field) => (
									<PhoneNumberInput
										onBlur={field.handleBlur}
										onChange={field.handleChange}
										placeholder={t`0000000000`}
										value={field.state.value}
									/>
								)}
							</Field>
						</View>

						<Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button disabled={!canSubmit} onPress={() => handleSubmit()}>
									{requestOtpMutation.isPending ? (
										<Trans>Loading...</Trans>
									) : (
										<Trans>Continue</Trans>
									)}
								</Button>
							)}
						</Subscribe>
					</>
				) : stage === 'signup' ? (
					<>
						<H2>
							<Trans>Create account</Trans>
						</H2>
						<Subscribe selector={(state) => state.values.phoneNumber}>
							{(phoneNumber) => (
								<Paragraph>
									<Trans>
										Let&apos;s create your account with the phone number{' '}
										<Paragraph weight="bold">
											{formatPhoneNumber(phoneNumber)}
										</Paragraph>
									</Trans>
								</Paragraph>
							)}
						</Subscribe>

						<View style={styles.inputContainer}>
							<Label style={styles.label}>
								<Trans>Name</Trans>
							</Label>

							<Field name="name">
								{(field) => (
									<>
										<Input
											autoCapitalize="words"
											autoComplete="name"
											error={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											}
											onBlur={field.handleBlur}
											onChangeText={field.handleChange}
											placeholder={t`Enter your full name`}
											returnKeyType="next"
											textContentType="name"
											value={field.state.value}
										/>
										{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 ? (
											<Text style={styles.errorText}>
												{field.state.meta.errors.at(0)?.message}
											</Text>
										) : null}
									</>
								)}
							</Field>
						</View>

						<View style={styles.inputContainer}>
							<Label style={styles.label}>
								<Trans>Date of birth (optional)</Trans>
							</Label>
							<Field name="birthdate">
								{(field) => (
									<>
										<Input
											autoComplete="birthdate-full"
											error={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											}
											keyboardType="numeric"
											mask="99/99/99999"
											maxLength={10}
											onBlur={field.handleBlur}
											onChangeText={field.handleChange}
											placeholder={t`DD/MM/YYYY`}
											value={field.state.value}
										/>
										{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 ? (
											<Text style={styles.errorText}>
												{field.state.meta.errors.at(0)?.message}
											</Text>
										) : null}
									</>
								)}
							</Field>
						</View>

						<Subscribe selector={(state) => state}>
							{(canSubmit) => (
								<Button
									disabled={
										requestOtpMutation.isPending || !canSubmit.canSubmit
									}
									onPress={() => handleSubmit()}
								>
									{requestOtpMutation.isPending ? (
										<Trans>Loading...</Trans>
									) : (
										<Trans>Verify</Trans>
									)}
								</Button>
							)}
						</Subscribe>

						<Pressable onPress={handleGoBack} style={styles.backButton}>
							<View style={styles.backButtonRow}>
								<Ionicons
									color={styles.backButtonText.color}
									name="arrow-back"
									size={16}
								/>
								<Text style={styles.backButtonText}>
									<Trans>Change phone number</Trans>
								</Text>
							</View>
						</Pressable>
					</>
				) : (
					<>
						<H2>
							<Trans>Enter verification code</Trans>
						</H2>

						<Subscribe selector={(state) => state.values.phoneNumber}>
							{(phoneNumber) => (
								<Paragraph>
									<Trans>
										We sent a code to {formatPhoneNumber(phoneNumber)}
									</Trans>
								</Paragraph>
							)}
						</Subscribe>

						<View style={styles.inputContainer}>
							<Field name="verificationCode">
								{(field) => (
									<>
										<OtpInput
											autoFocus
											onBlur={field.handleBlur}
											onChange={field.handleChange}
											onComplete={() => handleSubmit()}
											value={field.state.value}
										/>
										{field.state.meta.isBlurred &&
										field.state.meta.errors.length > 0 ? (
											<Text style={styles.errorText}>
												{field.state.meta.errors.at(0)?.message}
											</Text>
										) : null}
									</>
								)}
							</Field>
						</View>

						<Button
							disabled={verifyOtpMutation.isPending}
							onPress={() => handleSubmit()}
						>
							{verifyOtpMutation.isPending ? (
								<Trans>Verifying...</Trans>
							) : (
								<Trans>Verify</Trans>
							)}
						</Button>

						<Pressable onPress={handleGoBack} style={styles.backButton}>
							<View style={styles.backButtonRow}>
								<Ionicons
									color={styles.backButtonText.color}
									name="arrow-back"
									size={16}
								/>
								<Text style={styles.backButtonText}>
									<Trans>Change phone number</Trans>
								</Text>
							</View>
						</Pressable>
					</>
				)}
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	backButton: {
		alignItems: 'center',
		marginTop: theme.spacing.md,
	},
	backButtonRow: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.xs,
	},
	backButtonText: {
		color: theme.colors.primary.solid,
	},
	container: {
		_web: {
			alignItems: 'center',
			backgroundColor: 'rgba(1, 1, 1, 0.5)',
			justifyContent: 'center',
		},
	},
	contentContainer: {
		_web: {
			backgroundColor: theme.colors.gray.background,
			borderRadius: theme.borderRadius.lg,
			height: '100%',
			maxHeight: {
				md: 600,
			},
			maxWidth: {
				md: 600,
			},
			width: '100%',
		},
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	errorText: {
		color: theme.colors.error.solid,
		marginTop: theme.spacing.xs,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	inputContainer: {
		marginBottom: theme.spacing.md,
	},
	label: {
		color: theme.colors.gray.text,
		marginBottom: theme.spacing.xs,
	},
	message: {
		color: theme.colors.gray.solid,
	},
	messageContainer: {
		marginBottom: theme.spacing.md,
		marginTop: theme.spacing.md,
	},
}))
