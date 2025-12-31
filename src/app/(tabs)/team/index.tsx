import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { useRef } from 'react'
import { RefreshControl } from 'react-native'
import type { ScrollView } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { List, ListItem } from '@/components/List'
import { TabScreenContainer } from '@/components/ScreenContainer'
import { H2 } from '@/components/Text'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { queryClient } from '@/lib/query-client'

export default function TeamScreen() {
	const screenRef = useRef<ScrollView>(null)

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
			<TabScreenContainer
				contentContainerStyle={styles.contentContainer}
				ref={screenRef}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries()}
						refreshing={false}
					/>
				}
				withTopGradient
			>
				<H2 style={styles.sectionTitle}>
					<Trans>Team</Trans>
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
			</TabScreenContainer>
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
