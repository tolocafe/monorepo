import { Pressable, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Link } from 'expo-router'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'

import { LinearGradient } from '@/components/LinearGradient'
import { Text } from '@/components/Text'

import type { Coffee } from '@/lib/api'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const GRADIENT_COLORS = [
	['#8B4513', '#D2691E'], // Brown/Tan
	['#4A2511', '#6F4E37'], // Dark Brown
	['#654321', '#8B6914'], // Coffee Brown to Gold
	['#3E2723', '#5D4037'], // Dark Coffee
	['#3C1A1A', '#6D3838'], // Reddish Brown
] as const

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

	// Get a gradient color based on coffee name hash
	const gradientIndex =
		coffee.name
			// eslint-disable-next-line unicorn/prefer-spread
			.split('')
			// eslint-disable-next-line unicorn/prefer-code-point
			.reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0) % 5
	const gradientColors = GRADIENT_COLORS[gradientIndex]

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
								<Ionicons color="#FFFFFF" name="cafe" size={32} />
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
