import { Alert, Linking, Platform, RefreshControl, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import * as SecureStore from 'expo-secure-store'
import { StyleSheet } from 'react-native-unistyles'
import { z } from 'zod/v4'

import { Button } from '@/components/Button'
import DateInput from '@/components/date-input'
import HeaderGradient from '@/components/HeaderGradient'
import { Input } from '@/components/Input'
import { List, ListItem } from '@/components/List'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Label } from '@/components/Text'
import { STORAGE_KEYS } from '@/lib/constants/storage'
import {
	selfQueryOptions,
	signOutMutationOptions,
	updateClientMutationOptions,
} from '@/lib/queries/auth'
import { clearAllCache } from '@/lib/queries/cache-utils'

import type { ClientData } from '@/lib/api'

export default function ProfileScreen() {
	const { t } = useLingui()
	const queryClient = useQueryClient()

	const { data: user } = useQuery(selfQueryOptions)

	const nameSchema = z
		.string()
		.trim()
		.min(1, t`Please enter your name`)

	const emailSchema = z.email(t`Enter a valid email`).trim()

	const birthdateSchema = z
		.string()
		.trim()
		.regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, t`Enter a valid date (DD/MM/YYYY)`)

	const { mutateAsync: updateClient } = useMutation({
		...updateClientMutationOptions(user?.client_id as string),
		onSuccess(updated: ClientData) {
			queryClient.setQueryData(selfQueryOptions.queryKey, updated)

			Burnt.toast({
				duration: 2,
				haptic: 'success',
				message: t`Your profile has been updated.`,
				preset: 'done',
				title: t`Saved`,
			})
		},
	})

	const { mutateAsync: signOut } = useMutation(signOutMutationOptions)

	const { Field, handleSubmit, Subscribe } = useForm({
		defaultValues: {
			birthdate: user?.birthday || '',
			client_name: getFullName(user?.firstname, user?.lastname),
			email: user?.email || '',
		},
		onSubmit({ value }) {
			if (!user?.client_id) return

			return updateClient({
				birthday: value.birthdate,
				email: value.email,
				name: value.client_name,
			})
		},
	})

	const handleSignOut = async () => {
		async function signOutPress() {
			await signOut().catch(() => {
				Burnt.toast({
					duration: 3,
					haptic: 'error',
					message: t`Error signing out. Please try again.`,
					preset: 'error',
					title: t`Error`,
				})
			})

			if (Platform.OS !== 'web') {
				await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_SESSION)
			}

			await clearAllCache()

			if (router.canGoBack()) {
				router.back()
			} else {
				router.navigate('/more', { withAnchor: false })
			}
		}

		if (Platform.OS === 'web') {
			await signOutPress()
		} else {
			Alert.alert(t`Sign Out`, t`Are you sure you want to sign out?`, [
				{ style: 'cancel', text: t`Cancel` },
				{
					onPress: signOutPress,
					style: 'destructive',
					text: t`Sign Out`,
				},
			])
		}
	}

	return (
		<>
			<Head>
				<title>{t`Profile`}</title>
			</Head>
			<HeaderGradient />
			<ScreenContainer
				contentContainerStyle={styles.container}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries(selfQueryOptions)}
						refreshing={false}
					/>
				}
			>
				<View style={styles.section}>
					<H2>
						<Trans>Information</Trans>
					</H2>
					<List>
						<ListItem>
							<Label style={styles.label}>
								<Trans>First name</Trans>
							</Label>
							<Field
								name="client_name"
								validators={{
									onChange: ({ value }) => {
										const result = nameSchema.safeParse(value)
										if (!result.success) return result.error.issues[0]?.message
									},
								}}
							>
								{(field) => (
									<Input
										autoCapitalize="words"
										onBlur={field.handleBlur}
										onChangeText={field.handleChange}
										placeholder={t`Enter your first name`}
										value={field.state.value}
									/>
								)}
							</Field>
						</ListItem>

						<ListItem>
							<Label style={styles.label}>
								<Trans>Email</Trans>
							</Label>
							<Field
								name="email"
								validators={{
									onChange: ({ value }) => {
										const result = emailSchema.safeParse(value)
										if (!result.success) return result.error.issues[0]?.message
									},
								}}
							>
								{(field) => (
									<Input
										autoCapitalize="none"
										autoCorrect={false}
										keyboardType="email-address"
										onBlur={field.handleBlur}
										onChangeText={field.handleChange}
										placeholder={t`name@example.com`}
										value={field.state.value}
									/>
								)}
							</Field>
						</ListItem>

						<ListItem>
							<Label style={styles.label}>
								<Trans>Birthdate</Trans>
							</Label>
							<Field
								name="birthdate"
								validators={{
									onChange: ({ value }) => {
										const result = birthdateSchema.safeParse(value)
										if (!result.success) return result.error.issues[0]?.message
									},
								}}
							>
								{(field) => (
									<DateInput
										autoCapitalize="none"
										autoCorrect={false}
										onBlur={field.handleBlur}
										onChangeText={(_, storageValue) =>
											field.handleChange(storageValue)
										}
										placeholder={t`DD/MM/YYYY`}
										value={field.state.value}
									/>
								)}
							</Field>
						</ListItem>

						<Subscribe
							selector={({ canSubmit, isSubmitting }) => [
								canSubmit,
								isSubmitting,
							]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									disabled={!canSubmit || isSubmitting}
									onPress={handleSubmit}
								>
									{isSubmitting ? (
										<Trans>Saving...</Trans>
									) : (
										<Trans>Save</Trans>
									)}
								</Button>
							)}
						</Subscribe>
					</List>
				</View>

				<View style={styles.section}>
					<H2>
						<Trans>Account</Trans>
					</H2>
					<List>
						<ListItem
							accessibilityRole="link"
							chevron
							label={<Trans>Sessions</Trans>}
							onPress={() => router.push('/more/sessions')}
						/>
						<ListItem
							accessibilityRole="link"
							chevron
							label={<Trans>Delete</Trans>}
							onPress={() => Linking.openURL('https://www.tolo.cafe/eliminar')}
						/>
						<ListItem
							chevron
							label={<Trans>Sign Out</Trans>}
							onPress={handleSignOut}
						/>
					</List>
				</View>
			</ScreenContainer>
		</>
	)
}

function getFullName(
	firstname: string | undefined,
	lastname: string | undefined,
) {
	return `${firstname}${lastname ? ` ${lastname}` : ''}`
}

const styles = StyleSheet.create((theme) => ({
	balanceRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	container: {
		flex: 1,
		gap: theme.spacing.lg,
		padding: theme.layout.screenPadding,
	},
	label: {
		marginBottom: theme.spacing.xs,
	},
	section: {
		gap: theme.spacing.sm,
	},
}))
