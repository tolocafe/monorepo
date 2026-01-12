import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import {
	Platform,
	Pressable,
	RefreshControl,
	View,
	ActivityIndicator,
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
import { promotionQueryOptions } from '@/lib/queries/promotion'
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

function parseDescription(description: string | undefined) {
	if (!description) return null

	try {
		return JSON.parse(description) as BlockTextContent
	} catch {
		return null
	}
}

export default function PromotionScreen() {
	const { t } = useLingui()

	const { id } = useLocalSearchParams<{ id: string }>()
	const { data: promotion, isPending } = useQuery(promotionQueryOptions(id))

	useTrackScreenView(
		{
			promotion_id: promotion?.promotion_id ?? '',
			promotion_name: promotion?.name ?? '',
			screenName: 'promotion',
			skip: !promotion?.promotion_id,
		},
		[promotion],
	)

	if (!promotion) {
		if (isPending) {
			return (
				<ScreenContainer
					contentContainerStyle={styles.contentContainer}
					noScroll
				>
					<ActivityIndicator size="large" />
				</ScreenContainer>
			)
		}

		return (
			<ScreenContainer contentContainerStyle={styles.contentContainer} noScroll>
				<H1 align="center">
					<Trans>Promotion not found</Trans>
				</H1>
				<Paragraph align="center">
					<Trans>The requested promotion could not be loaded.</Trans>
				</Paragraph>
			</ScreenContainer>
		)
	}

	const hasImage = promotion.images?.[0]?.sourceId
	const imageSourceId = promotion.images?.[0]?.sourceId
	const descriptionContent = parseDescription(promotion.description)

	return (
		<>
			<Head>
				<title>{t`${promotion.name} - TOLO Good Coffee`}</title>
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
							queryClient.invalidateQueries(promotionQueryOptions(id))
						}
						refreshing={false}
					/>
				}
				withPaddingEdges={PADDING_EDGES}
				contentInsetAdjustmentBehavior="never"
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
						<H1 style={styles.titleOverlayText}>{promotion.name}</H1>
					</LinearGradient>
				</View>

				<View style={styles.content}>
					<View style={styles.promotionInfo}>
						{promotion.excerpt ? (
							<Paragraph style={styles.excerpt}>{promotion.excerpt}</Paragraph>
						) : null}

						{descriptionContent ? (
							<View style={styles.descriptionSection}>
								<BlockText value={descriptionContent} />
							</View>
						) : null}

						{(promotion.date_start || promotion.date_end) && (
							<View style={styles.datesSection}>
								<H2>
									<Trans>Valid Period</Trans>
								</H2>
								{promotion.date_start ? (
									<Paragraph>
										<Trans>Start: {formatDate(promotion.date_start)}</Trans>
									</Paragraph>
								) : null}
								{promotion.date_end ? (
									<Paragraph>
										<Trans>End: {formatDate(promotion.date_end)}</Trans>
									</Paragraph>
								) : null}
							</View>
						)}

						{(promotion.discount_percent || promotion.bonus) && (
							<View style={styles.detailsSection}>
								<H2>
									<Trans>Details</Trans>
								</H2>
								{promotion.discount_percent ? (
									<Paragraph>
										<Trans>Discount: {promotion.discount_percent}%</Trans>
									</Paragraph>
								) : null}
								{promotion.bonus ? (
									<Paragraph>
										<Trans>Bonus: {promotion.bonus}</Trans>
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
	closeButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.full,
		elevation: 5,
		height: theme.spacing.xl,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			height: 2,
			width: 0,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		width: theme.spacing.xl,
	},
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
	datesSection: {
		gap: theme.spacing.xs,
		marginTop: theme.spacing.lg,
	},
	descriptionSection: {
		marginTop: theme.spacing.md,
	},
	detailsSection: {
		gap: theme.spacing.xs,
		marginTop: theme.spacing.lg,
	},
	excerpt: {
		color: theme.colors.gray.solid,
		marginTop: theme.spacing.md,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		padding: theme.spacing.lg,
		position: 'absolute',
		right: 0,
		top: 40,
		zIndex: 1,
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
	promotionInfo: {
		gap: theme.spacing.md,
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
