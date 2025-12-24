import { Pressable, View } from 'react-native'

import { Image } from 'expo-image'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Card from '@/components/Card'
import { H4, Text } from '@/components/Text'
import { getImageUrl } from '@/lib/image'

import type { Promotion } from '@/lib/api'

const UniImage = withUnistyles(Image)

type Props = {
	promotion: Promotion
}

export default function PromotionCard({ promotion }: Props) {
	const scaleValue = useSharedValue(1)

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scaleValue.get() }],
	}))

	return (
		<Animated.View style={[animatedStyle, styles.container]}>
			<Pressable
				onPressIn={() => scaleValue.set(withSpring(0.96))}
				onPressOut={() => scaleValue.set(withSpring(1))}
				style={styles.pressable}
			>
				<Card padded={false} style={styles.card}>
					<View style={styles.imageContainer}>
						{promotion.images?.[0]?.sourceId ? (
							<UniImage
								contentFit="cover"
								placeholder={{
									cacheKey: `promotion-${promotion.promotion_id}-placeholder`,
									uri: getImageUrl(promotion.images[0].sourceId, {
										blur: 100,
										quality: 20,
										source: 'sanity',
										width: 400,
									}),
								}}
								placeholderContentFit="cover"
								source={{
									uri: getImageUrl(promotion.images[0].sourceId, {
										quality: 85,
										source: 'sanity',
										width: 600,
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
						<H4 numberOfLines={2}>{promotion.name}</H4>
						{promotion.excerpt ? (
							<Text numberOfLines={2} style={styles.excerpt}>
								{promotion.excerpt}
							</Text>
						) : null}
					</View>
				</Card>
			</Pressable>
		</Animated.View>
	)
}

const MAX_IMAGE_HEIGHT = 150

const styles = StyleSheet.create((theme, runtime) => {
	const baseWidth = runtime.screen.width * 0.66
	const baseHeight = baseWidth * (9 / 16) // 16:9 aspect ratio

	// Cap height at MAX_IMAGE_HEIGHT and recalculate width to maintain aspect ratio
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
		excerpt: {
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
			backgroundColor: theme.colors.verde.interactive,
			flex: 1,
		},
		pressable: {
			flex: 1,
		},
	}
})
