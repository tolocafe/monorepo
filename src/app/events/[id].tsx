import { Trans, useLingui } from '@lingui/react/macro'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack } from 'expo-router'
import Head from 'expo-router/head'
import {
	ActivityIndicator,
	Platform,
	Pressable,
	RefreshControl,
	View,
} from 'react-native'
import {
	StyleSheet,
	UnistylesRuntime,
	withUnistyles,
} from 'react-native-unistyles'

import BlockText from '@/components/BlockText'
import type { BlockTextContent } from '@/components/BlockText/types'
import { HeaderIconIonicons } from '@/components/Icons'
import { LinearGradient } from '@/components/LinearGradient'
import ScreenContainer from '@/components/ScreenContainer'
import { H1, H2, Paragraph } from '@/components/Text'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { getImageUrl } from '@/lib/image'
import { eventQueryOptions } from '@/lib/queries/events'
import { queryClient } from '@/lib/query-client'
import { formatDate } from '@/lib/utils/format-date'

const handleClose = () => {
	router.back()
}

const linearGradientColors = [
	'transparent',
	'rgba(0,0,0,0.4)',
	'rgba(0,0,0,0.85)',
] as const

const UniImage = withUnistyles(Image)

const gradient = {
	end: { x: 0, y: 1 },
	start: { x: 0, y: 0 },
}

const PADDING_EDGES = ['bottom'] as const

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

	const hasImage = event.images?.[0]?.sourceId
	const imageSourceId = event.images?.[0]?.sourceId
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
				withPaddingEdges={PADDING_EDGES}
			>
				<View style={styles.heroImageContainer}>
					{hasImage ? (
						<UniImage
							contentFit="cover"
							placeholder={{
								cacheKey: `${imageSourceId}-placeholder`,
								uri: getImageUrl(imageSourceId, {
									blur: 100,
									quality: 20,
									source: 'sanity',
									width: 200,
								}),
								width: UnistylesRuntime.screen.width,
							}}
							placeholderContentFit="cover"
							source={{
								cacheKey: `${imageSourceId}-image`,
								uri: getImageUrl(imageSourceId, {
									quality: 95,
									source: 'sanity',
									width: 900,
								}),
							}}
							style={styles.image}
							transition={200}
						/>
					) : (
						<View aria-hidden style={styles.imageFallback} />
					)}
					<LinearGradient
						colors={linearGradientColors}
						end={gradient.end}
						start={gradient.start}
						style={titleOverlayStyle}
					>
						<H1 style={styles.titleOverlayText}>{event.name}</H1>
					</LinearGradient>
				</View>

				<View style={styles.content}>
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
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	content: {
		_web: {
			paddingBottom: 50,
		},
		backgroundColor: theme.colors.gray.background,
		gap: theme.spacing.xxl,
		padding: theme.layout.screenPadding,
		paddingBottom: Platform.select({
			android: 40,
			default: theme.layout.screenPadding,
		}),
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
	titleOverlayText: {
		color: '#FFFFFF',
	},
}))

const titleOverlayStyle = {
	bottom: 0,
	left: 0,
	padding: 10,
	position: 'absolute' as const,
	right: 0,
}
