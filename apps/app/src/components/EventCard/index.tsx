import type { Event } from '@tolo/common'
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
import { H4, Text } from '@/components/Text'
import { getImageUrl } from '@/lib/image'

const MAX_IMAGE_HEIGHT = 150

const UniImage = withUnistyles(Image)

type Props = {
	event: Event
}

export default function EventCard({ event }: Props) {
	const scaleValue = useSharedValue(1)

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scaleValue.get() }],
	}))

	const imageSourceId = event.images?.[0]?.sourceId

	const handlePress = () => {
		router.push(`/events/${event.id}`)
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
						{event.images?.[0]?.sourceId ? (
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
						<H4 numberOfLines={2}>{event.name}</H4>
						{event.summary || event.description ? (
							<Text numberOfLines={2} style={styles.description}>
								{event.summary ?? event.description}
							</Text>
						) : null}
						{event.location ? (
							<Text numberOfLines={1} style={styles.meta}>
								{event.location}
							</Text>
						) : null}
						{event.dates?.[0] ? (
							<Text numberOfLines={1} style={styles.meta}>
								{event.dates[0]}
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
			backgroundColor: theme.colors.verde.interactive,
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
