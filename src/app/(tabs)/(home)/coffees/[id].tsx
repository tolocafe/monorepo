import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, Pressable, TouchableOpacity, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
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
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { scheduleOnRN } from 'react-native-worklets'

import { H1, Text } from '@/components/Text'
import { coffeeQueryOptions, coffeesQueryOptions } from '@/lib/queries/coffees'
import type { Coffee } from '@/lib/api'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const STORY_DURATION = 10_000
const PAGES_PER_COFFEE = 3
const WHITE_COLOR = '#FFFFFF'
const WHITE_ALPHA_30 = 'rgba(255, 255, 255, 0.3)'

const SPRING_CONFIG = {
	damping: 200,
	stiffness: 1000,
} as const

const GRADIENTS = [
	['#A0522D', '#D2691E', '#F4A460'], // Burnt Sienna to Sandy Brown (Caramel)
	['#8B2500', '#B8410B', '#D2691E'], // Dark Cherry to Burnt Orange (Cherry)
	['#6B4423', '#8B6914', '#DAA520'], // Coffee to Goldenrod (Honey/Golden)
	['#B8610B', '#D87020', '#F4A460'], // Burnt Orange to Peach (Peach/Apricot)
	['#704214', '#A0522D', '#CD853F'], // Rich Brown to Peru (Chocolate/Walnut)
] as const

export default function CoffeeStories() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const { data: coffees = [] } = useQuery(coffeesQueryOptions)
	const { data: currentCoffee } = useQuery(coffeeQueryOptions(id))

	const [currentPageIndex, setCurrentPageIndex] = useState(0)
	const [previousCoffeeIndex, setPreviousCoffeeIndex] = useState(0)

	const coffeeStories =
		coffees.length > 0 ? coffees : currentCoffee ? [currentCoffee] : []
	const totalPages = coffeeStories.length * PAGES_PER_COFFEE
	const totalPagesRef = useRef(totalPages)

	const progress = useSharedValue(0)
	const scale = useSharedValue(1)
	const slideX = useSharedValue(0)
	const dismissAlpha = useSharedValue(0)
	const mountScale = useSharedValue(0)

	// Mount animation
	useEffect(() => {
		mountScale.value = withSpring(1, SPRING_CONFIG)
		dismissAlpha.value = withSpring(0.8, SPRING_CONFIG)
	}, [mountScale, dismissAlpha])

	// Update ref when totalPages changes
	useEffect(() => {
		totalPagesRef.current = totalPages
	}, [totalPages])

	const handleCloseRef = useRef<(() => void) | null>(null)

	const goToNextPage = useCallback(() => {
		setCurrentPageIndex((prev) => {
			if (prev < totalPagesRef.current - 1) {
				return prev + 1
			}
			if (handleCloseRef.current) {
				handleCloseRef.current()
			}
			return prev
		})
	}, [])

	const startTimer = useCallback(() => {
		progress.value = 0
		progress.value = withTiming(1, { duration: STORY_DURATION }, (finished) => {
			if (finished) {
				scheduleOnRN(goToNextPage)
			}
		})
	}, [goToNextPage])

	const goToPreviousPage = useCallback(() => {
		setCurrentPageIndex((prev) => (prev > 0 ? prev - 1 : prev))
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
	}, [goToPreviousPage])

	const handleRightTap = useCallback(() => {
		progress.value = 0
		goToNextPage()
	}, [goToNextPage])

	const handleClose = useCallback(() => {
		mountScale.value = withSpring(0, SPRING_CONFIG, (finished) => {
			if (finished) {
				scheduleOnRN(router.back)
			}
		})
		dismissAlpha.value = withSpring(0, SPRING_CONFIG)
	}, [mountScale, dismissAlpha])

	// Update ref for goToNextPage
	useEffect(() => {
		handleCloseRef.current = handleClose
	}, [handleClose])

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
		transform: [
			{ scale: scale.value * mountScale.value },
			{ translateX: slideX.value },
		],
		opacity: mountScale.value,
	}))

	if (coffeeStories.length === 0) {
		return null
	}

	const currentPageInCoffee = currentPageIndex % PAGES_PER_COFFEE
	const currentCoffeeStory = coffeeStories[currentCoffeeIndex]
	const gradientColors = GRADIENTS[currentCoffeeIndex % GRADIENTS.length]

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
								<TouchableOpacity
									onPress={handleClose}
									style={styles.closeButton}
								>
									<Ionicons color={WHITE_COLOR} name="close" size={36} />
								</TouchableOpacity>
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

type DetailRowProps = {
	icon: keyof typeof Ionicons.glyphMap
	label: string
	value: string
}

function DetailRow({ icon, label, value }: DetailRowProps) {
	return (
		<View style={styles.detailRow}>
			<View style={styles.detailBadge}>
				<Ionicons color={WHITE_COLOR} name={icon} size={16} />
				<Text>{label}</Text>
			</View>
			<Text align="right" weight="bold" style={styles.headerText}>
				{value}
			</Text>
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

function VarietalPage({ coffee }: { coffee: Coffee }) {
	return (
		<>
			<DetailRow icon="leaf" label="Varietal" value={coffee.varietal} />
			<DetailRow icon="flask" label="Process" value={coffee.process} />
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

const styles = StyleSheet.create((theme, runtime) => ({
	closeButton: {
		padding: theme.spacing.xs,
	},
	coffeeDetails: {
		gap: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
		width: '100%',
	},
	coffeeImage: {
		borderRadius: theme.borderRadius.xl,
		height: runtime.screen.width * 0.8,
		width: runtime.screen.width * 0.8,
	},
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.md,
		paddingTop: runtime.insets.top,
		paddingBottom: runtime.insets.bottom,
		_web: {
			padding: 0,
		},
	},
	contentCenter: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.xl,
		justifyContent: 'space-between',
	},
	contentWrapper: {
		flex: 1,
		zIndex: 2,
		justifyContent: 'space-between',
		paddingTop: theme.layout.screenPadding,
		width: '100%',
		paddingBottom: theme.spacing.xl,
	},
	coffeeDetailsCentered: {
		gap: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
		flex: 1,
		justifyContent: 'center',
		width: '100%',
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
	headerContent: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
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
		width: '100%',
		paddingHorizontal: theme.layout.screenPadding,
		zIndex: 2,
		height: 2,
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
		zIndex: 3,
		transform: [{ translateY: 80 }],
	},
	headerText: {
		color: WHITE_COLOR,
		fontSize: theme.fontSizes.md,
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
	tastingNotesContainer: {
		alignItems: 'center',
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		alignContent: 'center',
		paddingHorizontal: theme.layout.screenPadding,
		width: '100%',
		height: '100%',
	},
	tastingNoteText: {
		color: WHITE_COLOR,
		fontSize: theme.fontSizes.md,
		fontWeight: theme.fontWeights.semibold,
	},
}))
