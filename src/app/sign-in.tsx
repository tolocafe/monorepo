import { useState } from 'react'
import { Alert, Platform, Pressable, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { StyleSheet } from 'react-native-unistyles'
import { z } from 'zod/v4'

import { Button } from '@/components/Button'
import OtpInput from '@/components/otp-input'
import PhoneNumberInput from '@/components/phone-number-input'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Label, Paragraph, Text } from '@/components/Text'
import {
	requestOtpMutationOptions,
	verifyOtpMutationOptions,
} from '@/lib/queries/auth'

const SignInSchema = z.object({
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
	const [stage, setStage] = useState<'code' | 'phone'>('phone')
	const queryClient = useQueryClient()

	const requestOtpMutation = useMutation(requestOtpMutationOptions)
	const verifyOtpMutation = useMutation({
		...verifyOtpMutationOptions,
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['self'] })

			router.replace('/')
		},
	})

	const { Field, handleSubmit, resetField, Subscribe } = useForm({
		defaultValues: {
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
					// Reset code field meta/value when moving to next stage
					resetField('verificationCode')
					return
				}

				await verifyOtpMutation.mutateAsync({
					code: value.verificationCode.trim(),
					phone: value.phoneNumber.trim(),
					sessionName: Platform.OS,
				})
			} catch (error) {
				if (stage === 'phone') {
					Alert.alert(
						t`Error`,
						(error as Error).message || t`Failed to send code`,
					)
				} else {
					// Clear OTP on error to allow re-entry
					resetField('verificationCode')
					Alert.alert(
						t`Error`,
						(error as Error).message || t`Invalid verification code`,
					)
				}
			}
		},
		validators: { onChange: SignInSchema },
	})

	const handleGoBack = () => {
		setStage('phone')

		resetField('verificationCode')
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
				contentContainerStyle={{ alignContent: 'center', padding: 10 }}
				keyboardAware
			>
				{itemName && (
					<View style={styles.messageContainer}>
						<Paragraph style={styles.message}>
							<Trans>Sign in to add &ldquo;{itemName}&rdquo; to your bag</Trans>
						</Paragraph>
					</View>
				)}

				<View style={styles.content}>
					<View style={styles.authContainer}>
						{stage === 'phone' ? (
							<>
								<H2 style={styles.title}>
									<Trans>Sign in with your phone</Trans>
								</H2>
								<Paragraph style={styles.subtitle}>
									<Trans>We&apos;ll send you a verification code</Trans>
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
												<Trans>Sending...</Trans>
											) : (
												<Trans>Send Code</Trans>
											)}
										</Button>
									)}
								</Subscribe>
							</>
						) : (
							<>
								<H2 style={styles.title}>
									<Trans>Enter verification code</Trans>
								</H2>

								<Subscribe selector={(state) => state.values.phoneNumber}>
									{(phone) => (
										<Paragraph style={styles.subtitle}>
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
														{field.state.meta.errors[0]?.message}
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
					</View>
				</View>
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
	subtitle: {
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.md,
	},
	title: {
		marginBottom: theme.spacing.xs,
	},
}))
