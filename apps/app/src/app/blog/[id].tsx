import { Trans, useLingui } from '@lingui/react/macro'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack } from 'expo-router'
import Head from 'expo-router/head'
import { Platform, RefreshControl, View, ActivityIndicator } from 'react-native'
import {
	StyleSheet,
	UnistylesRuntime,
	withUnistyles,
} from 'react-native-unistyles'

import BlockText from '~/components/BlockText'
import type { BlockTextContent } from '~/components/BlockText/types'
import { LinearGradient } from '~/components/LinearGradient'
import ScreenContainer from '~/components/ScreenContainer'
import { H1, Paragraph } from '~/components/Text'
import { useTrackScreenView } from '~/lib/analytics/hooks'
import { getImageUrl } from '~/lib/image'
import { blogPostQueryOptions } from '~/lib/queries/blog'
import { queryClient } from '~/lib/query-client'
import { formatDate } from '~/lib/utils/format-date'

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

export default function BlogPostScreen() {
	const { t } = useLingui()

	const { params } = useRoute()
	const { id } = params as { id: string }
	const { data: post, isPending } = useQuery(blogPostQueryOptions(id))

	useTrackScreenView(
		{
			post_id: post?.id ?? '',
			post_name: post?.name ?? '',
			screenName: 'blog_post',
			skip: !post?.id,
		},
		[post],
	)

	if (!post) {
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
					<Trans>Blog post not found</Trans>
				</H1>
				<Paragraph align="center">
					<Trans>The requested blog post could not be loaded.</Trans>
				</Paragraph>
			</ScreenContainer>
		)
	}

	const hasImage = post.image?.sourceId
	const imageSourceId = post.image?.sourceId
	const descriptionContent = parseDescription(post.description)

	return (
		<>
			<Head>
				<title>{t`${post.name} - TOLO Good Coffee`}</title>
			</Head>
			<Stack.Screen>
				<Stack.Header>
					<Stack.Header.Title>{''}</Stack.Header.Title>
					<Stack.Header.Left>
						<Stack.Header.Button icon="xmark" onPress={handleClose} />
					</Stack.Header.Left>
				</Stack.Header>
			</Stack.Screen>
			<ScreenContainer
				refreshControl={
					<RefreshControl
						onRefresh={() =>
							queryClient.invalidateQueries(blogPostQueryOptions(id))
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
						<H1 style={styles.titleOverlayText}>{post.name}</H1>
					</LinearGradient>
				</View>

				<View style={styles.content}>
					<View style={styles.postInfo}>
						{post.createdAt && (
							<Paragraph style={styles.date}>
								<Trans>{formatDate(post.createdAt)}</Trans>
							</Paragraph>
						)}

						{post.summary ? (
							<Paragraph style={styles.summary}>{post.summary}</Paragraph>
						) : null}

						{descriptionContent ? (
							<View style={styles.descriptionSection}>
								<BlockText value={descriptionContent} />
							</View>
						) : null}
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
	date: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.sm,
		marginTop: theme.spacing.md,
	},
	descriptionSection: {
		marginTop: theme.spacing.md,
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
	postInfo: {
		gap: theme.spacing.md,
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
