import type { ImageSourcePropType } from 'react-native'
import { Pressable, View } from 'react-native'

import { Image } from 'expo-image'
import { Link } from 'expo-router'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'

import { LinearGradient } from '@/components/LinearGradient'
import { Text } from '@/components/Text'
import {
	COFFEE_GRADIENT_COLORS,
	getCoffeeGradientIndex,
} from '@/lib/constants/coffee-gradients'

import type { Coffee } from '@/lib/api'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const GRADIENT_START = { x: 0, y: 0 }
const GRADIENT_END = { x: 1, y: 1 }

const BUBBLE_SIZE = 55

type Props = {
	coffee: Coffee
}

export default function CoffeeStoryBubble({ coffee }: Props) {
	const scale = useSharedValue(1)

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}))

	const gradientIndex = getCoffeeGradientIndex(coffee.name)
	const gradientColors = COFFEE_GRADIENT_COLORS[gradientIndex]

	return (
		<Link asChild href={`/(tabs)/(home)/coffees/${coffee.slug}`}>
			<AnimatedPressable
				onPressIn={() => scale.set(withSpring(0.9))}
				onPressOut={() => scale.set(withSpring(1))}
				style={animatedStyle}
			>
				<View style={styles.storyBubble}>
					<View style={styles.storyBubbleRing}>
						<View style={styles.storyBubbleImageContainer}>
							<LinearGradient
								colors={gradientColors}
								end={GRADIENT_END}
								start={GRADIENT_START}
								style={styles.storyBubbleGradient}
							/>
							<View style={styles.storyBubbleContent}>
								<Image
									source={
										require('@/assets/images/coffee-bean.png') as ImageSourcePropType
									}
									style={styles.coffeeBeanImage}
								/>
							</View>
						</View>
					</View>
					<Text numberOfLines={2} style={styles.storyBubbleText}>
						{coffee.name}
					</Text>
				</View>
			</AnimatedPressable>
		</Link>
	)
}

const styles = StyleSheet.create((theme) => ({
	coffeeBeanImage: {
		height: 30,
		width: 30,
	},
	storyBubble: {
		alignItems: 'center',
		gap: theme.spacing.xs,
		width: BUBBLE_SIZE + 16,
	},
	storyBubbleContent: {
		alignItems: 'center',
		height: '100%',
		justifyContent: 'center',
		width: '100%',
	},
	storyBubbleGradient: {
		height: '100%',
		position: 'absolute',
		width: '100%',
	},
	storyBubbleImageContainer: {
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.full,
		height: BUBBLE_SIZE,
		overflow: 'hidden',
		width: BUBBLE_SIZE,
	},
	storyBubbleRing: {
		alignItems: 'center',
		borderColor: theme.colors.verde.solid,
		borderRadius: theme.borderRadius.full,
		borderWidth: 3,
		justifyContent: 'center',
		padding: 3,
	},
	storyBubbleText: {
		fontSize: theme.fontSizes.sm,
		textAlign: 'center',
	},
}))
