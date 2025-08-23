/* eslint-disable @typescript-eslint/no-base-to-string */
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { captureException } from '@sentry/react-native'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { StyleSheet } from 'react-native-unistyles'
import { z } from 'zod/v4'

import { Button } from '@/components/Button'
import Input from '@/components/Input'
import OtpInput from '@/components/otp-input'
import PhoneNumberInput from '@/components/phone-number-input'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Label, Paragraph, Text } from '@/components/Text'
import { enableAnalytics } from '@/lib/firebase'
import { requestTrackingPermissionAsync } from '@/lib/notifications'
import {
	requestOtpMutationOptions,
	verifyOtpMutationOptions,
} from '@/lib/queries/auth'

const SignInSchema = z.object({
	birthdate: z.string().trim(),
	name: z.string().trim(),
	phoneNumber: z.string().trim().min(1, 'Please enter a phone number'),
	verificationCode: z
		.string()
		.trim()
		.regex(/^\d{6}$/u, 'The code must be 6 digits')
		.or(z.literal('')),
})

export default function SignIn() {
	const { t } = useLingui()
	const { itemName } = useLocalSearchParams<{ itemName?: string }>()
	const [stage, setStage] = useState<'code' | 'phone' | 'signup'>('phone')
	const [_requiredFields, setRequiredFields] = useState<string[]>([])
	const queryClient = useQueryClient()

	const requestOtpMutation = useMutation(requestOtpMutationOptions)
	const verifyOtpMutation = useMutation({
		...verifyOtpMutationOptions,
		async onSuccess(data) {
			await queryClient.invalidateQueries({ queryKey: ['self'] })

			// Request tracking permission after successful sign-in
			requestTrackingPermissionAsync()
				.then((granted) => {
					if (granted) {
						void enableAnalytics({
							email: data.client.email,
							firstName: data.client.firstname,
							lastName: data.client.lastname,
							phoneNumber: data.client.phone_number,
							userId: data.client.client_id,
						})
					}
				})
				.catch(captureException)

			router.replace('/', { withAnchor: false })
		},
	})

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
						birthdate: value.birthdate.trim() || undefined,
						name: value.name.trim() || undefined,
						phone: value.phoneNumber.trim(),
					})

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
			} catch (error: unknown) {
				if (stage === 'phone') {
					// Check if it's a validation error requiring name/birthdate
					const errorResponse = error as {
						response?: {
							json?: () => Promise<{
								error?: string
								fields?: { name: string }[]
							}>
						}
					}

					try {
						const errorData = await errorResponse.response?.json?.()
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

					Burnt.toast({
						duration: 3,
						haptic: 'error',
						message: (error as Error).message || t`Failed to send code`,
						preset: 'error',
						title: t`Error`,
					})
				} else if (stage === 'signup') {
					Burnt.toast({
						duration: 3,
						haptic: 'error',
						message: (error as Error).message || t`Failed to send code`,
						preset: 'error',
						title: t`Error`,
					})
				} else {
					// Clear OTP on error to allow re-entry
					resetField('verificationCode')

					Burnt.toast({
						duration: 3,
						haptic: 'error',
						message: (error as Error).message || t`Invalid verification code`,
						preset: 'error',
						title: t`Error`,
					})
				}
			}
		},
		validators: { onChange: SignInSchema },
	})

	const handleGoBack = () => {
		if (stage === 'signup') {
			setStage('phone')
			setRequiredFields([])
		} else {
			setStage('phone')
			resetField('verificationCode')
		}
	}

	return (
		<>
			<Stack.Screen
				options={{
					animation: Platform.select({
						default: undefined,
						web: 'fade',
					}),
					headerBackVisible: false,
					headerRight: () => (
						<Pressable
							accessibilityLabel={t`Close`}
							accessibilityRole="button"
							onPress={() => router.back()}
							style={styles.headerIconPressable}
						>
							<Ionicons
								color={styles.headerIconText.color}
								name="close"
								size={24}
							/>
						</Pressable>
					),
					headerShadowVisible: false,
					headerShown: true,
					headerTitle: '',
					headerTransparent: true,
					presentation: Platform.select({
						default: 'modal',
						web: 'transparentModal',
					}),
				}}
			/>
			<ScreenContainer
				bounces={false}
				contentContainerStyle={styles.contentContainer}
				keyboardAware
				withTopPadding
			>
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
										placeholder={t`123 456 7890`}
										value={field.state.value}
									/>
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
										<Paragraph weight="bold">{phoneNumber}</Paragraph>
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
												{field.state.meta.errors[0]?.message}
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
											maxLength={10}
											onBlur={field.handleBlur}
											onChangeText={field.handleChange}
											placeholder={t`DD/MM/YYYY`}
											value={field.state.value}
										/>
										{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 ? (
											<Text style={styles.errorText}>
												{String(field.state.meta.errors[0])}
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
							{(phone) => (
								<Paragraph>
									<Trans>We sent a code to {phone}</Trans>
								</Paragraph>
							)}
						</Subscribe>

						<View style={styles.inputContainer}>
							<Field name="verificationCode">
								{(field) => (
									<>
										<OtpInput
											onBlur={field.handleBlur}
											onChange={field.handleChange}
											onComplete={() => handleSubmit()}
											value={field.state.value}
										/>
										{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 ? (
											<Text style={styles.errorText}>
												{String(field.state.meta.errors[0])}
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
	authContainer: {
		gap: theme.spacing.md,
	},
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
		color: theme.colors.primary,
	},
	container: {
		backgroundColor: theme.colors.background,
		flex: 1,
		padding: theme.layout.screenPadding,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
	},
	contentContainer: {
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	errorText: {
		color: theme.colors.error,
		marginTop: theme.spacing.xs,
	},
	headerIconPressable: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 44,
		minWidth: 44,
		padding: theme.spacing.sm,
	},
	headerIconText: {
		color: theme.colors.text,
		fontSize: theme.fontSizes.xxl,
	},
	input: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		color: theme.colors.text,
		...theme.typography.input,
		padding: theme.spacing.sm,
	},
	inputContainer: {
		marginBottom: theme.spacing.md,
	},
	label: {
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	message: {
		color: theme.colors.textSecondary,
	},
	messageContainer: {
		marginBottom: theme.spacing.md,
		marginTop: theme.spacing.md,
	},
}))
