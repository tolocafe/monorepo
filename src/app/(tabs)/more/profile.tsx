import { useMemo } from 'react'
import { Alert, Platform, RefreshControl, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Head from 'expo-router/head'
import * as SecureStore from 'expo-secure-store'
import { StyleSheet } from 'react-native-unistyles'
import { z } from 'zod/v4'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { ScreenContainer } from '@/components/ScreenContainer'
import { Label, Text } from '@/components/Text'
import {
	selfQueryOptions,
	updateClientMutationOptions,
} from '@/lib/queries/auth'
import { clearAllCache } from '@/lib/queries/cache-utils'
import { formatPrice } from '@/lib/utils/price'

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
		.regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, t`Enter a valid date (YYYY-MM-DD)`)

	const form = useForm({
		defaultValues: {
			birthday: user?.birthday || '',
			client_name: getFullName(user?.firstname, user?.lastname),
			email: user?.email || '',
		},
	})

	const isDirty = useMemo(
		() =>
			getFullName(user?.firstname, user?.lastname) !==
				form.state.values.client_name ||
			(user?.email ?? '') !== form.state.values.email ||
			(user?.birthday ?? '') !== form.state.values.birthday,
		[
			user?.firstname,
			user?.lastname,
			user?.email,
			user?.birthday,
			form.state.values.client_name,
			form.state.values.email,
			form.state.values.birthday,
		],
	)

	const updateMutation = useMutation({
		...updateClientMutationOptions(user?.client_id ?? ''),
		onSuccess(updated: ClientData) {
			queryClient.setQueryData(selfQueryOptions.queryKey, updated)
		},
	})

	const handleSave = async () => {
		if (!user?.client_id || !isDirty) return
		await updateMutation.mutateAsync({
			birthday: form.state.values.birthday,
			email: form.state.values.email,
			name: form.state.values.client_name,
		})
	}

	const handleSignOut = () => {
		Alert.alert(t`Sign Out`, t`Are you sure you want to sign out?`, [
			{ style: 'cancel', text: t`Cancel` },
			{
				onPress: async () => {
					if (Platform.OS !== 'web') {
						await SecureStore.deleteItemAsync('auth_session')
					}
					await clearAllCache()
				},
				style: 'destructive',
				text: t`Sign Out`,
			},
		])
	}

	const balanceCents = Number(user?.ewallet ?? '0')
	const balance = balanceCents.toFixed(2)

	return (
		<>
			<Head>
				<title>{t`Profile`}</title>
			</Head>
			<ScreenContainer
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries(selfQueryOptions)}
						refreshing={updateMutation.isPending}
					/>
				}
			>
				<View style={styles.section}>
					<Label style={styles.sectionTitle}>
						<Trans>Wallet</Trans>
					</Label>
					<View style={styles.card}>
						<View style={styles.balanceRow}>
							<Label>
								<Trans>Balance</Trans>
							</Label>
							<Text style={styles.balanceValue}>{formatPrice(balance)}</Text>
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<Label style={styles.sectionTitle}>
						<Trans>Personal Information</Trans>
					</Label>
					<View style={styles.card}>
						<View style={styles.row}>
							<Label style={styles.label}>
								<Trans>First name</Trans>
							</Label>
							<form.Field
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
							</form.Field>
						</View>

						<View style={styles.row}>
							<Label style={styles.label}>
								<Trans>Email</Trans>
							</Label>
							<form.Field
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
							</form.Field>
						</View>

						<View style={styles.row}>
							<Label style={styles.label}>
								<Trans>Birthdate</Trans>
							</Label>
							<form.Field
								name="birthday"
								validators={{
									onChange: ({ value }) => {
										const result = birthdateSchema.safeParse(value)
										if (!result.success) return result.error.issues[0]?.message
									},
								}}
							>
								{(field) => (
									<Input
										autoCapitalize="none"
										autoCorrect={false}
										keyboardType="numbers-and-punctuation"
										onBlur={field.handleBlur}
										onChangeText={field.handleChange}
										placeholder={t`YYYY-MM-DD`}
										value={field.state.value}
									/>
								)}
							</form.Field>
						</View>

						<Button
							disabled={!isDirty || updateMutation.isPending}
							onPress={handleSave}
						>
							{updateMutation.isPending ? (
								<Trans>Saving...</Trans>
							) : (
								<Trans>Save</Trans>
							)}
						</Button>
						<View style={styles.row} />
						<Button onPress={handleSignOut}>
							<Trans>Sign Out</Trans>
						</Button>
					</View>
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
	balanceValue: {
		fontSize: theme.fontSizes.xl,
		fontWeight: theme.fontWeights.bold,
	},
	card: {
		backgroundColor: theme.colors.surface,
		borderCurve: Platform.OS === 'ios' ? 'continuous' : undefined,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
	},
	container: {
		flex: 1,
	},
	label: {
		marginBottom: theme.spacing.xs,
	},
	row: {
		marginBottom: theme.spacing.md,
	},
	section: {
		margin: theme.layout.screenPadding,
	},
	sectionTitle: {
		marginBottom: theme.spacing.md,
	},
}))
