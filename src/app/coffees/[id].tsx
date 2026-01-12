import Ionicons from '@expo/vector-icons/Ionicons'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, Pressable, View } from 'react-native'
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { scheduleOnRN } from 'react-native-worklets'

import { LinearGradient } from '@/components/LinearGradient'
import { H1, Text } from '@/components/Text'
import { trackEvent } from '@/lib/analytics'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import type { Coffee } from '@/lib/api'
import {
	COFFEE_STORY_GRADIENT_COLORS,
	getCoffeeGradientIndex,
} from '@/lib/constants/coffee-gradients'
import { coffeeQueryOptions, coffeesQueryOptions } from '@/lib/queries/coffees'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const STORY_DURATION = 10_000
const PAGES_PER_COFFEE = 3
const WHITE_COLOR = '#FFFFFF'
const WHITE_ALPHA_30 = 'rgba(255, 255, 255, 0.3)'
/** Offset for tap areas to avoid overlapping with header controls */
const TAP_AREAS_TOP_OFFSET = 80

const SPRING_CONFIG = {
	damping: 200,
	stiffness: 1000,
} as const

type DetailRowProps = {
	icon: keyof typeof Ionicons.glyphMap
	label: string
	value: string
}

export default function CoffeeStoryScreen() {
	const { params } = useRoute()
	const { id } = params as { id: string }
	const { data: coffees = [] } = useQuery(coffeesQueryOptions)
	const { data: currentCoffee } = useQuery(coffeeQueryOptions(id))

	const coffeeStories = useMemo(() => {
		if (coffees.length > 0) {
			return coffees
		}
		if (currentCoffee) {
			return [currentCoffee]
		}
		return []
	}, [coffees, currentCoffee])

	const [currentPageIndex, setCurrentPageIndex] = useState(0)
	const [previousCoffeeIndex, setPreviousCoffeeIndex] = useState(0)
	const initializedRef = useRef(false)

	const totalPages = coffeeStories.length * PAGES_PER_COFFEE

	const progress = useSharedValue(0)
	const scale = useSharedValue(1)
	const slideX = useSharedValue(0)
	const dismissAlpha = useSharedValue(0)
	const mountScale = useSharedValue(0)

	// Mount animation
	useEffect(() => {
		mountScale.value = withSpring(1, SPRING_CONFIG)
		dismissAlpha.value = withSpring(0.8, SPRING_CONFIG)
	}, [dismissAlpha, mountScale])

	// Set initial page when coffee data loads (only once)
	useEffect(() => {
		if (initializedRef.current || coffeeStories.length === 0) return

		const coffeeIndex = coffeeStories.findIndex((coffee) => coffee.slug === id)
		if (coffeeIndex !== -1) {
			setCurrentPageIndex(coffeeIndex * PAGES_PER_COFFEE)
			setPreviousCoffeeIndex(coffeeIndex)
			initializedRef.current = true
		}
	}, [coffeeStories, id])

	useTrackScreenView(
		{
			coffee_id: currentCoffee?.slug ?? '',
			coffee_name: currentCoffee?.name ?? '',
			screenName: 'coffee-story',
			skip: !currentCoffee,
		},
		[currentCoffee],
	)

	const handleClose = useCallback(() => {
		mountScale.value = withSpring(0, SPRING_CONFIG, (finished) => {
			if (finished) {
				scheduleOnRN(router.back)
			}
		})
		dismissAlpha.value = withSpring(0, SPRING_CONFIG)
	}, [dismissAlpha, mountScale])

	const goToNextPage = useCallback(() => {
		setCurrentPageIndex((previous) => {
			if (previous < totalPages - 1) {
				return previous + 1
			}
			// User completed viewing all coffee stories
			trackEvent('menu:coffee_story_complete')
			handleClose()
			return previous
		})
	}, [totalPages, handleClose])

	const startTimer = useCallback(() => {
		progress.value = 0
		progress.value = withTiming(1, { duration: STORY_DURATION }, (finished) => {
			if (finished) {
				scheduleOnRN(goToNextPage)
			}
		})
	}, [goToNextPage, progress])

	const goToPreviousPage = useCallback(() => {
		setCurrentPageIndex((previous) => (previous > 0 ? previous - 1 : previous))
	}, [])

	const currentCoffeeIndex = useMemo(
		() => Math.floor(currentPageIndex / PAGES_PER_COFFEE),
		[currentPageIndex],
	)

	useEffect(() => {
		startTimer()
	}, [currentPageIndex, startTimer])

	// Animate slide when coffee index changes
	useEffect(() => {
		if (currentCoffeeIndex !== previousCoffeeIndex) {
			const direction = currentCoffeeIndex > previousCoffeeIndex ? 1 : -1
			const screenWidth = UnistylesRuntime.screen.width

			// Start from off-screen and slide in with spring
			slideX.value = direction * screenWidth
			slideX.value = withSpring(0, SPRING_CONFIG)

			// Update state immediately
			setPreviousCoffeeIndex(currentCoffeeIndex)
		}
	}, [currentCoffeeIndex, previousCoffeeIndex, slideX])

	const handleLeftTap = useCallback(() => {
		progress.value = 0
		goToPreviousPage()
	}, [goToPreviousPage, progress])

	const handleRightTap = useCallback(() => {
		progress.value = 0
		goToNextPage()
	}, [goToNextPage, progress])

	const panGesture = Gesture.Pan()
		.onUpdate((event) => {
			const absTranslation = Math.abs(event.translationY)
			scale.value = 1 - absTranslation / SCREEN_HEIGHT / 2
			// Fade out background as user pulls down
			dismissAlpha.value = Math.max(0, 0.8 - absTranslation / 250)
		})
		.onEnd((event) => {
			if (Math.abs(event.translationY) > 100) {
				scheduleOnRN(handleClose)
			} else {
				scale.value = withSpring(1, SPRING_CONFIG)
				dismissAlpha.value = withSpring(0.8, SPRING_CONFIG)
			}
		})

	const animatedContainerStyle = useAnimatedStyle(() => ({
		backgroundColor: `rgba(0, 0, 0, ${dismissAlpha.value})`,
	}))

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: mountScale.value,
		transform: [
			{ scale: scale.value * mountScale.value },
			{ translateX: slideX.value },
		],
	}))

	if (coffeeStories.length === 0) {
		return null
	}

	const currentPageInCoffee = currentPageIndex % PAGES_PER_COFFEE
	const currentCoffeeStory = coffeeStories[currentCoffeeIndex]
	const gradientColors =
		COFFEE_STORY_GRADIENT_COLORS[
			getCoffeeGradientIndex(
				currentCoffeeStory.name,
				COFFEE_STORY_GRADIENT_COLORS.length,
			)
		]

	// Determine which image to show based on current page
	const currentImage =
		currentPageInCoffee === 0
			? currentCoffeeStory['region-image']
			: currentPageInCoffee === 1
				? currentCoffeeStory['varietal-image']
				: null

	return (
		<GestureHandlerRootView>
			<Animated.View style={[styles.container, animatedContainerStyle]}>
				<GestureDetector gesture={panGesture}>
					<Animated.View
						style={[
							styles.storyContainer,
							animatedStyle,
							{ backgroundColor: gradientColors[0] },
						]}
					>
						{/* Background Gradient */}
						<LinearGradient
							colors={gradientColors}
							end={{ x: 0.5, y: 1 }}
							start={{ x: 0, y: 0 }}
							style={styles.gradient}
						/>

						{/* Story Content */}
						<View style={styles.contentWrapper}>
							{/* Progress Bars */}
							<View style={styles.progressContainer}>
								{Array.from({ length: PAGES_PER_COFFEE }).map((_, index) => (
									<View key={index} style={styles.progressBarContainer}>
										<ProgressBar
											active={index === currentPageInCoffee}
											completed={index < currentPageInCoffee}
											progress={progress}
										/>
									</View>
								))}
							</View>
							<View style={styles.header}>
								<H1 style={styles.headerText}>{currentCoffeeStory.name}</H1>
								<Pressable onPress={handleClose} style={styles.closeButton}>
									<Ionicons color={WHITE_COLOR} name="close" size={30} />
								</Pressable>
							</View>
							{/* Header */}

							{/* Main Content Area */}
							<View style={styles.contentCenter}>
								<View aria-hidden />

								{currentPageInCoffee === 2 ? (
									<TastingNotes coffee={currentCoffeeStory} />
								) : currentImage ? (
									<>
										<Image
											contentFit="cover"
											source={{ uri: currentImage.url }}
											style={styles.coffeeImage}
										/>
										<View style={styles.coffeeDetails}>
											{currentPageInCoffee === 0 ? (
												<RegionPage coffee={currentCoffeeStory} />
											) : (
												<VarietalPage coffee={currentCoffeeStory} />
											)}
										</View>
									</>
								) : (
									<View style={styles.coffeeDetailsCentered}>
										{currentPageInCoffee === 0 ? (
											<RegionPage coffee={currentCoffeeStory} />
										) : (
											<VarietalPage coffee={currentCoffeeStory} />
										)}
									</View>
								)}
							</View>
						</View>

						{/* Tap Areas */}
						<View style={styles.tapAreas}>
							<Pressable onPress={handleLeftTap} style={styles.tapAreaLeft} />
							<Pressable onPress={handleRightTap} style={styles.tapAreaRight} />
						</View>
					</Animated.View>
				</GestureDetector>
			</Animated.View>
		</GestureHandlerRootView>
	)
}

function DetailRow({ icon, label, value }: DetailRowProps) {
	return (
		<View style={styles.detailRow}>
			<View style={styles.detailBadge}>
				<Ionicons color={WHITE_COLOR} name={icon} size={16} />
				<Text>{label}</Text>
			</View>
			<Text align="right" style={styles.headerText} weight="bold">
				{value}
			</Text>
		</View>
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

function RegionPage({ coffee }: { coffee: Coffee }) {
	return (
		<>
			<DetailRow icon="location" label="Origin" value={coffee.origin} />
			{coffee.altitude && (
				<DetailRow
					icon="trending-up"
					label="Altitude"
					value={`${coffee.altitude}m`}
				/>
			)}
			<DetailRow icon="map" label="Region" value={coffee.region} />
		</>
	)
}

function TastingNotes({ coffee }: { coffee: Coffee }) {
	const tastingNotes = coffee['tasting-notes']
		?.split(',')
		.map((note) => note.trim())
		.filter(Boolean)

	if (!tastingNotes?.length) return null

	return (
		<View style={styles.tastingNotesContainer}>
			{tastingNotes.map((note, index) => (
				<View key={`${note}-${index}`} style={styles.tastingNoteCircle}>
					<Text align="center" style={styles.tastingNoteText}>
						{note}
					</Text>
				</View>
			))}
		</View>
	)
}

function VarietalPage({ coffee }: { coffee: Coffee }) {
	return (
		<>
			<DetailRow icon="leaf" label="Varietal" value={coffee.varietal} />
			<DetailRow icon="flask" label="Process" value={coffee.process} />
		</>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	closeButton: {
		padding: theme.spacing.xs,
	},
	coffeeDetails: {
		gap: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
		width: '100%',
	},
	coffeeDetailsCentered: {
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.layout.screenPadding,
		width: '100%',
	},
	coffeeImage: {
		borderRadius: theme.borderRadius.xl,
		height: runtime.screen.width * 0.8,
		width: runtime.screen.width * 0.8,
	},
	container: {
		_web: {
			padding: 0,
		},
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		paddingBottom: runtime.insets.bottom,
		paddingHorizontal: theme.spacing.md,
		paddingTop: runtime.insets.top,
	},
	contentCenter: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.xl,
		justifyContent: 'space-between',
	},
	contentWrapper: {
		flex: 1,
		justifyContent: 'space-between',
		paddingBottom: theme.spacing.xl,
		paddingTop: theme.layout.screenPadding,
		width: '100%',
		zIndex: 2,
	},
	detailBadge: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.xs,
		minWidth: 100,
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
		paddingHorizontal: theme.layout.screenPadding,
	},
	headerText: {
		color: WHITE_COLOR,
		fontSize: theme.fontSizes.md,
	},
	progressBar: {
		backgroundColor: WHITE_ALPHA_30,
		borderRadius: 20,
		flex: 1,
		overflow: 'hidden',
	},
	progressBarContainer: {
		flex: 1,
	},
	progressBarFill: {
		backgroundColor: WHITE_COLOR,
		height: '100%',
	},
	progressContainer: {
		flexDirection: 'row',
		gap: 4,
		height: 2,
		paddingHorizontal: theme.layout.screenPadding,
		width: '100%',
		zIndex: 2,
	},
	storyContainer: {
		borderRadius: theme.borderRadius.lg,
		height: '100%',
		overflow: 'hidden',
		position: 'relative',
		width: '100%',
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
		transform: [{ translateY: TAP_AREAS_TOP_OFFSET }],
		zIndex: 3,
	},
	tastingNoteCircle: {
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderColor: WHITE_ALPHA_30,
		borderRadius: theme.borderRadius.full,
		borderWidth: 2,
		height: 120,
		justifyContent: 'center',
		marginBottom: theme.spacing.sm,
		marginHorizontal: -theme.spacing.xs,
		width: 120,
	},
	tastingNoteText: {
		color: WHITE_COLOR,
		fontSize: theme.fontSizes.md,
		fontWeight: theme.fontWeights.semibold,
	},
	tastingNotesContainer: {
		alignContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		flexWrap: 'wrap',
		height: '100%',
		justifyContent: 'center',
		paddingHorizontal: theme.layout.screenPadding,
		width: '100%',
	},
}))
