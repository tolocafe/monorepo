import type { Coffee } from '@tolo/common/api'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import Animated from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'

import { LinearGradient } from '~/components/LinearGradient'
import { Text } from '~/components/Text'
import {
	COFFEE_GRADIENT_COLORS,
	getCoffeeGradientIndex,
} from '~/lib/constants/coffee-gradients'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const GRADIENT_START = { x: 0, y: 0 }
const GRADIENT_END = { x: 1, y: 1 }

const BUBBLE_CONTENT_SIZE = 55
export const BUBBLE_SIZE = BUBBLE_CONTENT_SIZE + 16

type Props = {
	coffee: Coffee
}

export default function CoffeeStoryBubble({ coffee }: Props) {
	const gradientIndex = getCoffeeGradientIndex(coffee.name)
	const gradientColors = COFFEE_GRADIENT_COLORS[gradientIndex]

	return (
		<Link asChild href={`/coffees/${coffee.slug}`}>
			<AnimatedPressable>
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
										require('~/assets/images/coffee-bean.png') as ImageSourcePropType
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
		width: BUBBLE_SIZE,
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
		height: BUBBLE_CONTENT_SIZE,
		overflow: 'hidden',
		width: BUBBLE_CONTENT_SIZE,
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
