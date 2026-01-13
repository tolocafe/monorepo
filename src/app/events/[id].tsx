import { Trans, useLingui } from '@lingui/react/macro'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import Head from 'expo-router/head'
import {
	ActivityIndicator,
	Platform,
	Pressable,
	RefreshControl,
	View,
} from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import BlockText from '@/components/BlockText'
import type { BlockTextContent } from '@/components/BlockText/types'
import { HeaderIconIonicons } from '@/components/Icons'
import ScreenContainer from '@/components/ScreenContainer'
import { H1, H2, Paragraph } from '@/components/Text'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { eventQueryOptions } from '@/lib/queries/events'
import { queryClient } from '@/lib/query-client'
import { formatDate } from '@/lib/utils/format-date'

const handleClose = () => {
	router.back()
}

function parseDescription(description: string | undefined | null) {
	if (!description) return null

	try {
		return JSON.parse(description) as BlockTextContent
	} catch {
		return null
	}
}

export default function EventScreen() {
	const { t } = useLingui()

	const { params } = useRoute()
	const { id } = params as { id: string }
	const { data: event, isPending } = useQuery(eventQueryOptions(id))

	useTrackScreenView(
		{
			event_id: event?.id ?? '',
			event_name: event?.name ?? '',
			screenName: 'event',
			skip: !event?.id,
		},
		[event],
	)

	if (!event) {
		if (isPending) {
			return (
				<ScreenContainer
					noScroll
					contentContainerStyle={styles.contentContainer}
				>
					<ActivityIndicator size="large" />
				</ScreenContainer>
			)
		}

		return (
			<ScreenContainer noScroll contentContainerStyle={styles.contentContainer}>
				<H1>
					<Trans>Event not found</Trans>
				</H1>
				<Paragraph>
					<Trans>The requested event could not be loaded.</Trans>
				</Paragraph>
			</ScreenContainer>
		)
	}

	const descriptionContent = parseDescription(event.description)

	return (
		<>
			<Head>
				<title>{t`${event.name} - TOLO Good Coffee`}</title>
			</Head>
			<Stack.Screen
				options={{
					headerBackVisible: true,
					headerLeft: Platform.select({
						ios: () => (
							<Pressable onPress={handleClose}>
								<HeaderIconIonicons name="close-outline" size={35} />
							</Pressable>
						),
					}),
					title: '',
				}}
			/>
			<ScreenContainer
				refreshControl={
					<RefreshControl
						onRefresh={() =>
							queryClient.invalidateQueries(eventQueryOptions(id))
						}
						refreshing={false}
					/>
				}
				style={styles.container}
			>
				<H1>{event.name}</H1>
				<View style={styles.eventInfo}>
					{event.summary ? (
						<Paragraph style={styles.summary}>{event.summary}</Paragraph>
					) : null}

					{descriptionContent ? (
						<View style={styles.descriptionSection}>
							<BlockText value={descriptionContent} />
						</View>
					) : null}

					{(event.dates?.length || event.location) && (
						<View style={styles.detailsSection}>
							<H2>
								<Trans>Event Details</Trans>
							</H2>
							{event.dates?.length ? (
								<View style={styles.datesList}>
									{event.dates.map((date, index) => (
										<Paragraph key={index}>
											<Trans>{formatDate(date)}</Trans>
										</Paragraph>
									))}
								</View>
							) : null}
							{event.location ? (
								<Paragraph style={styles.location}>
									<Trans>Location: {event.location}</Trans>
								</Paragraph>
							) : null}
						</View>
					)}
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		backgroundColor: theme.colors.gray.background,
	},
	contentContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
	datesList: {
		gap: theme.spacing.xs,
		marginTop: theme.spacing.xs,
	},
	descriptionSection: {
		marginTop: theme.spacing.md,
	},
	detailsSection: {
		gap: theme.spacing.xs,
		marginTop: theme.spacing.lg,
	},
	eventInfo: {
		gap: theme.spacing.md,
	},
	heroImageContainer: {
		backgroundColor: theme.colors.gray.border,
		height: 300,
		position: 'relative',
		width: '100%',
	},
	image: {
		height: '100%',
		objectFit: 'cover',
		width: '100%',
	},
	imageFallback: {
		backgroundColor: theme.colors.verde.interactive,
		height: '100%',
		width: '100%',
	},
	location: {
		marginTop: theme.spacing.xs,
	},
	summary: {
		color: theme.colors.gray.solid,
		marginTop: theme.spacing.md,
	},
}))
