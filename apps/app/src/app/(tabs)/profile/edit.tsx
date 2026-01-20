import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClientData } from '@tolo/common'
import * as Burnt from 'burnt'
import { Stack } from 'expo-router'
import Head from 'expo-router/head'
import { RefreshControl, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { z } from 'zod/v4'

import Button from '~/components/Button'
import Input from '~/components/Input'
import { List, ListItem } from '~/components/List'
import ScreenContainer from '~/components/ScreenContainer'
import { H2, Label } from '~/components/Text'
import { useTrackScreenView } from '~/lib/analytics/hooks'
import {
	selfQueryOptions,
	updateClientMutationOptions,
} from '~/lib/queries/auth'

export default function EditProfileScreen() {
	const { t } = useLingui()
	const queryClient = useQueryClient()

	useTrackScreenView({ screenName: 'edit-profile' }, [])

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

	return (
		<>
			<Head>
				<title>{t`Edit Profile`}</title>
			</Head>
			<Stack.Screen>
				<Stack.Header>
					<Stack.Header.Title>{t`Edit Profile`}</Stack.Header.Title>
				</Stack.Header>
			</Stack.Screen>
			<ScreenContainer
				keyboardAware
				contentContainerStyle={styles.contentContainer}
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
									onChange({ value }) {
										const result = birthdateSchema.safeParse(value)
										if (!result.success) {
											return result.error.issues[0]?.message
										}
									},
								}}
							>
								{(field) => (
									<Input
										autoCapitalize="none"
										autoCorrect={false}
										keyboardType="numbers-and-punctuation"
										maxLength={10}
										onBlur={field.handleBlur}
										onChangeText={field.handleChange}
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
	contentContainer: {
		gap: theme.spacing.lg,
	},
	label: {
		marginBottom: theme.spacing.xs,
	},
	section: {
		gap: theme.spacing.sm,
	},
}))
