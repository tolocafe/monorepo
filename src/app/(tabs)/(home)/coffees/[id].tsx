import { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, Pressable, TouchableOpacity, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useQuery } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native-unistyles'
import { scheduleOnRN } from 'react-native-worklets'

import { H1, H4, Text } from '@/components/Text'
import { coffeeQueryOptions, coffeesQueryOptions } from '@/lib/queries/coffees'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const STORY_DURATION = 5000 // 5 seconds per story

const gradients = [
	['#8B4513', '#D2691E', '#CD853F'], // Brown/Tan
	['#4A2511', '#6F4E37', '#A0522D'], // Dark Brown
	['#654321', '#8B6914', '#DAA520'], // Coffee Brown to Gold
	['#3E2723', '#5D4037', '#795548'], // Dark Coffee
	['#3C1A1A', '#6D3838', '#A05656'], // Reddish Brown
] as const

export default function CoffeeStories() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const { data: coffees = [] } = useQuery(coffeesQueryOptions)
	const { data: currentCoffee } = useQuery(coffeeQueryOptions(id))

	const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
	const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

	// Use either all coffees or just the current coffee
	const stories =
		coffees.length > 0 ? coffees : currentCoffee ? [currentCoffee] : []

	const progress = useSharedValue(0)
	const scale = useSharedValue(1)

	const startTimer = useCallback(() => {
		progress.set(0)
		progress.set(
			withTiming(1, { duration: STORY_DURATION }, (finished) => {
				if (finished) {
					scheduleOnRN(goToNextStory)
				}
			}),
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentStoryIndex, stories.length])

	const goToNextStory = useCallback(() => {
		if (currentStoryIndex < stories.length - 1) {
			setCurrentStoryIndex((prev) => prev + 1)
		} else {
			router.back()
		}
	}, [currentStoryIndex, stories.length])

	const goToPreviousStory = useCallback(() => {
		if (currentStoryIndex > 0) {
			setCurrentStoryIndex((prev) => prev - 1)
		}
	}, [currentStoryIndex])

	useEffect(() => {
		startTimer()
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current)
			}
		}
	}, [currentStoryIndex, startTimer])

	const handleLeftTap = useCallback(() => {
		progress.set(0)
		goToPreviousStory()
	}, [goToPreviousStory, progress])

	const handleRightTap = useCallback(() => {
		progress.set(0)
		goToNextStory()
	}, [goToNextStory, progress])

	const handleClose = useCallback(() => {
		router.back()
	}, [])

	const panGesture = Gesture.Pan()
		.onUpdate((event) => {
			scale.set(1 - Math.abs(event.translationY) / SCREEN_HEIGHT / 2)
		})
		.onEnd((event) => {
			if (Math.abs(event.translationY) > 100) {
				scheduleOnRN(handleClose)
			} else {
				scale.set(withSpring(1))
			}
		})

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.get() }],
	}))

	if (stories.length === 0) {
		return null
	}

	const currentStory = stories[currentStoryIndex]
	const gradientColors = gradients[currentStoryIndex % gradients.length]

	return (
		<GestureHandlerRootView>
			<Stack.Screen
				options={{
					animation: 'fade',
					headerShown: false,
					presentation: 'transparentModal',
				}}
			/>
			<View style={styles.container}>
				<GestureDetector gesture={panGesture}>
					<Animated.View style={[styles.storyContainer, animatedStyle]}>
						{/* Background Gradient */}
						<LinearGradient
							colors={gradientColors}
							end={{ x: 0.5, y: 1 }}
							start={{ x: 0, y: 0 }}
							style={styles.gradient}
						/>

						{/* Progress Bars */}
						<View style={styles.progressContainer}>
							{stories.map((_, index) => (
								<View key={index} style={styles.progressBarContainer}>
									<ProgressBar
										active={index === currentStoryIndex}
										completed={index < currentStoryIndex}
										progress={progress}
									/>
								</View>
							))}
						</View>

						{/* Header */}
						<View style={styles.header}>
							<View style={styles.headerContent}>
								<H4 style={styles.whiteText}>Coffee Stories</H4>
							</View>
							<TouchableOpacity
								onPress={handleClose}
								style={styles.closeButton}
							>
								<Ionicons color="#FFFFFF" name="close" size={28} />
							</TouchableOpacity>
						</View>

						{/* Story Content */}
						<View style={styles.contentCenter}>
							<View style={styles.coffeeCard}>
								<H1 align="center" style={styles.whiteText}>
									{currentStory.name}
								</H1>

								<View style={styles.coffeeDetails}>
									<View style={styles.detailRow}>
										<View style={styles.detailBadge}>
											<Ionicons color="#FFFFFF" name="location" size={16} />
											<Text style={styles.detailLabel}>Origin</Text>
										</View>
										<Text align="right" weight="bold" style={styles.whiteText}>
											{currentStory.origin}
										</Text>
									</View>

									<View style={styles.detailRow}>
										<View style={styles.detailBadge}>
											<Ionicons color="#FFFFFF" name="map" size={16} />
											<Text style={styles.detailLabel}>Region</Text>
										</View>
										<Text align="right" weight="bold" style={styles.whiteText}>
											{currentStory.region}
										</Text>
									</View>

									<View style={styles.detailRow}>
										<View style={styles.detailBadge}>
											<Ionicons color="#FFFFFF" name="leaf" size={16} />
											<Text style={styles.detailLabel}>Varietal</Text>
										</View>
										<Text align="right" weight="bold" style={styles.whiteText}>
											{currentStory.varietal}
										</Text>
									</View>

									<View style={styles.detailRow}>
										<View style={styles.detailBadge}>
											<Ionicons color="#FFFFFF" name="flask" size={16} />
											<Text style={styles.detailLabel}>Process</Text>
										</View>
										<Text align="right" weight="bold" style={styles.whiteText}>
											{currentStory.process}
										</Text>
									</View>

									{currentStory.altitude ? (
										<View style={styles.detailRow}>
											<View style={styles.detailBadge}>
												<Ionicons
													color="#FFFFFF"
													name="trending-up"
													size={16}
												/>
												<Text style={styles.detailLabel}>Altitude</Text>
											</View>
											<Text
												align="right"
												weight="bold"
												style={styles.whiteText}
											>
												{currentStory.altitude}m
											</Text>
										</View>
									) : null}
								</View>
							</View>
						</View>

						{/* Tap Areas */}
						<View style={styles.tapAreas}>
							<Pressable onPress={handleLeftTap} style={styles.tapAreaLeft} />
							<Pressable onPress={handleRightTap} style={styles.tapAreaRight} />
						</View>
					</Animated.View>
				</GestureDetector>
			</View>
		</GestureHandlerRootView>
	)
}

function ProgressBar({
	active,
	completed,
	progress,
}: {
	active: boolean
	completed: boolean
	progress: ReturnType<typeof useSharedValue<number>>
}) {
	const animatedStyle = useAnimatedStyle(() => {
		if (completed) return { width: '100%' }
		if (!active) return { width: '0%' }
		return { width: `${progress.value * 100}%` }
	})

	return (
		<View style={styles.progressBar}>
			<Animated.View style={[styles.progressBarFill, animatedStyle]} />
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	closeButton: {
		padding: theme.spacing.xs,
	},
	coffeeCard: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		backdropFilter: 'blur(10px)',
		borderColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: theme.borderRadius.xl,
		borderWidth: 1,
		gap: theme.spacing.xl,
		padding: theme.spacing.xl,
	},
	coffeeDetails: {
		gap: theme.spacing.md,
	},
	container: {
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.95)',
		flex: 1,
		justifyContent: 'center',
	},
	contentCenter: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: theme.layout.screenPadding,
	},
	detailBadge: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.xs,
		minWidth: 100,
	},
	detailLabel: {
		color: 'rgba(255, 255, 255, 0.8)',
		fontSize: theme.fontSizes.sm,
	},
	detailRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	gradient: {
		...StyleSheet.absoluteFillObject,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		left: theme.layout.screenPadding,
		position: 'absolute',
		right: theme.layout.screenPadding,
		top: 60,
		zIndex: 2,
	},
	headerContent: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	progressBar: {
		backgroundColor: 'rgba(255, 255, 255, 0.3)',
		borderRadius: 2,
		flex: 1,
		height: 3,
		overflow: 'hidden',
	},
	progressBarContainer: {
		flex: 1,
	},
	progressBarFill: {
		backgroundColor: '#FFFFFF',
		height: '100%',
	},
	progressContainer: {
		flexDirection: 'row',
		gap: 4,
		left: theme.layout.screenPadding,
		position: 'absolute',
		right: theme.layout.screenPadding,
		top: 50,
		zIndex: 2,
	},
	storyContainer: {
		backgroundColor: '#000000',
		borderRadius: theme.borderRadius.xl,
		height: SCREEN_HEIGHT * 0.9,
		overflow: 'hidden',
		position: 'relative',
		width: SCREEN_WIDTH * 0.95,
	},
	tapAreaLeft: {
		flex: 1,
		height: '100%',
	},
	tapAreaRight: {
		flex: 1,
		height: '100%',
	},
	tapAreas: {
		...StyleSheet.absoluteFillObject,
		flexDirection: 'row',
	},
	whiteText: {
		color: '#FFFFFF',
	},
}))
