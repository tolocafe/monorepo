import { RefreshControl, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { List, ListItem } from '@/components/List'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Paragraph } from '@/components/Text'
import { sessionsQueryOptions } from '@/lib/queries/auth'

const formatSessionDate = (timestamp: number) =>
	new Date(timestamp).toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

const formatSessionTime = (timestamp: number) =>
	new Date(timestamp).toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	})

export default function SessionsScreen() {
	const { t } = useLingui()
	const queryClient = useQueryClient()

	const { data: sessions, isPending } = useQuery(sessionsQueryOptions)

	return (
		<>
			<Head>
				<title>{t`Sessions`}</title>
			</Head>
			<ScreenContainer
				contentContainerStyle={styles.container}
				refreshControl={
					<RefreshControl
						onRefresh={() =>
							queryClient.invalidateQueries(sessionsQueryOptions)
						}
						refreshing={isPending}
					/>
				}
				withTopGradient
			>
				<View style={styles.section}>
					<H2>
						<Trans>Active Sessions</Trans>
					</H2>
					<Paragraph style={styles.description}>
						<Trans>
							These are the devices and browsers currently signed in to your
							account.
						</Trans>
					</Paragraph>

					{isPending ? (
						<View style={styles.loadingContainer}>
							<Paragraph>
								<Trans>Loading sessions...</Trans>
							</Paragraph>
						</View>
					) : sessions && sessions.length > 0 ? (
						<List>
							{sessions.map((session, index) => (
								<ListItem key={`${session.createdAt}-${index}`}>
									<ListItem.Label>{session.name}</ListItem.Label>
									<ListItem.Text>
										<>
											{formatSessionDate(session.createdAt)} •{' '}
											{formatSessionTime(session.createdAt)}
										</>
									</ListItem.Text>
								</ListItem>
							))}
						</List>
					) : (
						<View style={styles.emptyContainer}>
							<Paragraph>
								<Trans>No active sessions found.</Trans>
							</Paragraph>
						</View>
					)}
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flexGrow: 1,
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	description: {
		color: theme.colors.crema.solid,
		marginBottom: theme.spacing.md,
	},
	emptyContainer: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.lg,
		justifyContent: 'center',
		minHeight: 120,
		padding: theme.spacing.lg,
	},
	loadingContainer: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.lg,
		justifyContent: 'center',
		minHeight: 120,
		padding: theme.spacing.lg,
	},
	section: {
		gap: theme.spacing.sm,
	},
}))
