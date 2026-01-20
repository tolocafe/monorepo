import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { router, Stack } from 'expo-router'
import Head from 'expo-router/head'
import { RefreshControl } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { List, ListItem } from '~/components/List'
import ScreenContainer from '~/components/ScreenContainer'
import { H2 } from '~/components/Text'
import { useTrackScreenView } from '~/lib/analytics/hooks'
import { queryClient } from '~/lib/query-client'

export default function TeamScreen() {
	useTrackScreenView({ screenName: 'team' }, [])

	return (
		<>
			<Head>
				<title>{t`Team - TOLO`}</title>
				<meta
					content={t`Team tools and operations for TOLO.`}
					name="description"
				/>
				<meta content={t`Team - TOLO`} property="og:title" />
				<meta content="/team" property="og:url" />
			</Head>
			<Stack.Screen>
				<Stack.Header>
					<Stack.Header.Title>{t`Team`}</Stack.Header.Title>
				</Stack.Header>
			</Stack.Screen>
			<ScreenContainer
				contentContainerStyle={styles.contentContainer}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries()}
						refreshing={false}
					/>
				}
			>
				<H2 style={styles.sectionTitle}>
					<Trans>Orders</Trans>
				</H2>

				<List>
					<ListItem
						accessibilityRole="link"
						chevron
						onPress={() => router.push('/team/queue')}
					>
						<ListItem.Label>
							<Trans>Queue</Trans>
						</ListItem.Label>
					</ListItem>
				</List>

				<H2 style={styles.sectionTitle}>
					<Trans>Customers</Trans>
				</H2>
				<List>
					<ListItem
						accessibilityRole="link"
						chevron
						onPress={() => router.push('/team/redeem')}
					>
						<ListItem.Label>
							<Trans>Redeem</Trans>
						</ListItem.Label>
					</ListItem>
					<ListItem
						accessibilityRole="link"
						chevron
						onPress={() => router.push('/team/ticket')}
					>
						<ListItem.Label>
							<Trans>Tickets</Trans>
						</ListItem.Label>
					</ListItem>
				</List>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	contentContainer: {
		gap: theme.spacing.md,
	},
	sectionTitle: {
		marginBottom: theme.spacing.sm,
	},
}))
