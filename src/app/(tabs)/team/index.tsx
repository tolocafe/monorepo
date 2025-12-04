import { useRef } from 'react'
import type { ScrollView } from 'react-native'
import { RefreshControl, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { List, ListItem } from '@/components/List'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Paragraph } from '@/components/Text'
import { queryClient } from '@/lib/query-client'

export default function TeamIndex() {
	const screenRef = useRef<ScrollView>(null)

	return (
		<>
			<Head>
				<title>Team - TOLO</title>
				<meta
					content="Team tools and operations for TOLO."
					name="description"
				/>
				<meta content="Team - TOLO" property="og:title" />
				<meta content="/team" property="og:url" />
			</Head>
			<ScreenContainer
				ref={screenRef}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries()}
						refreshing={false}
					/>
				}
				withTopGradient
				withTopPadding
			>
				<View style={styles.section}>
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
						<ListItem
							accessibilityRole="link"
							chevron
							onPress={() => router.push('/team/ticket')}
						>
							<ListItem.Label>
								<Trans>Download Ticket PDF</Trans>
							</ListItem.Label>
						</ListItem>
					</List>
				</View>

				<View style={styles.footer}>
					<Paragraph style={styles.footerText}>
						<Trans>Team tools and quick links</Trans>
					</Paragraph>
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	footer: {
		alignItems: 'center',
		paddingVertical: theme.spacing.md,
	},
	footerText: {
		color: theme.colors.gray.text,
		fontSize: theme.typography.caption.fontSize,
		textAlign: 'center',
	},
	section: {
		marginBottom: theme.spacing.lg,
		paddingHorizontal: theme.layout.screenPadding,
	},
	sectionTitle: {
		marginBottom: theme.spacing.sm,
	},
}))
