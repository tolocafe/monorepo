import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Card from '@/components/Card'
import { Text, H4 } from '@/components/Text'
import { getImageUrl } from '@/lib/image'
import type { BlogPost } from '@/lib/queries/blog'

const MAX_IMAGE_HEIGHT = 150

const UniImage = withUnistyles(Image)

type Props = {
	post: BlogPost
}

export default function BlogCard({ post }: Props) {
	const scaleValue = useSharedValue(1)

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scaleValue.get() }],
	}))

	const imageSourceId = post.image?.sourceId

	const handlePress = () => {
		router.push(`/blog/${post.id}`)
	}

	return (
		<Animated.View style={[animatedStyle, styles.container]}>
			<Pressable
				onPress={handlePress}
				onPressIn={() => scaleValue.set(withSpring(0.96))}
				onPressOut={() => scaleValue.set(withSpring(1))}
				style={styles.pressable}
			>
				<Card padded={false} style={styles.card}>
					<View style={styles.imageContainer}>
						{post.image?.sourceId ? (
							<UniImage
								contentFit="cover"
								placeholder={{
									cacheKey: `${imageSourceId}-placeholder`,
									uri: getImageUrl(imageSourceId, {
										blur: 100,
										quality: 20,
										source: 'sanity',
										width: 350,
									}),
								}}
								placeholderContentFit="cover"
								source={{
									cacheKey: `${imageSourceId}-image`,
									uri: getImageUrl(imageSourceId, {
										quality: 90,
										source: 'sanity',
										width: 350,
									}),
								}}
								style={styles.image}
								transition={200}
							/>
						) : (
							<View aria-hidden style={styles.imagePlaceholder} />
						)}
					</View>
					<View style={styles.content}>
						<H4 numberOfLines={2}>{post.name}</H4>
						{post.summary || post.description ? (
							<Text numberOfLines={2} style={styles.description}>
								{post.summary ?? post.description}
							</Text>
						) : null}
						{post.createdAt ? (
							<Text numberOfLines={1} style={styles.meta}>
								{new Date(post.createdAt).toLocaleDateString()}
							</Text>
						) : null}
					</View>
				</Card>
			</Pressable>
		</Animated.View>
	)
}

const styles = StyleSheet.create((theme, runtime) => {
	const baseWidth = runtime.screen.width * 0.66
	const baseHeight = baseWidth * (9 / 16)

	const imageHeight = Math.min(baseHeight, MAX_IMAGE_HEIGHT)
	const itemWidth =
		imageHeight === MAX_IMAGE_HEIGHT ? MAX_IMAGE_HEIGHT * (16 / 9) : baseWidth

	return {
		card: {
			height: '100%',
			overflow: 'hidden',
		},
		container: {
			width: itemWidth,
		},
		content: {
			flex: 1,
			gap: theme.spacing.xs,
			justifyContent: 'center',
			padding: theme.spacing.md,
		},
		description: {
			color: theme.colors.gray.solid,
			fontSize: theme.fontSizes.sm,
		},
		image: {
			flex: 1,
			objectFit: 'cover',
		},
		imageContainer: {
			backgroundColor: theme.colors.gray.border,
			borderCurve: 'continuous',
			borderTopLeftRadius: theme.borderRadius.lg,
			borderTopRightRadius: theme.borderRadius.lg,
			height: imageHeight,
			overflow: 'hidden',
			width: '100%',
		},
		imagePlaceholder: {
			backgroundColor: theme.colors.primary.interactive,
			flex: 1,
		},
		meta: {
			color: theme.colors.gray.solid,
			fontSize: theme.fontSizes.sm,
		},
		pressable: {
			flex: 1,
		},
	}
})
