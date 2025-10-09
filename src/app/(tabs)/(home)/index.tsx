import { Fragment, useEffect, useMemo, useRef } from 'react'
import type { ScrollView } from 'react-native'
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	TouchableOpacity,
	View,
} from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { ErrorBoundary } from '@sentry/react-native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import Head from 'expo-router/head'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, H4, Paragraph, Text } from '@/components/Text'
import { enableAnalytics } from '@/lib/analytics/firebase'
import { getImageUrl } from '@/lib/image'
import { requestTrackingPermissionAsync } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'
import { coffeesQueryOptions } from '@/lib/queries/coffees'
import {
	categoriesQueryOptions,
	productsQueryOptions,
} from '@/lib/queries/menu'
import { queryClient } from '@/lib/query-client'
import { useAddItemGuarded } from '@/lib/stores/order-store'
import { getProductBaseCost } from '@/lib/utils/price'

import type { Category, Coffee, Product } from '@/lib/api'

const UniImage = withUnistyles(Image)
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
const UniActivityIndicator = withUnistyles(ActivityIndicator, (theme) => ({
	color: theme.colors.gray.solid,
}))

const categoryKeyExtractor = (item: Product) => item.product_id

const ITEM_SIZE = 180

const menuItemFallback = <View aria-hidden />

// Define category order - categories not in this list will appear at the end in alphabetical order
const CATEGORY_ORDER = ['De Temporada', 'Café', 'Matcha', 'Té y Tisanas']

export default function Menu() {
	const { t } = useLingui()
	const addItem = useAddItemGuarded()
	const { data: selfData } = useQuery(selfQueryOptions)

	const screenRef = useRef<ScrollView>(null)

	useScrollToTop(screenRef)

	const { data: menu, error, isFetching } = useQuery(productsQueryOptions)
	const { data: categories } = useQuery(categoriesQueryOptions)
	const { data: coffees = [] } = useQuery(coffeesQueryOptions)
	const categoriesWithItems = useMemo(
		() =>
			categories
				.map((category) => {
					const categoryItems = menu.filter(
						(item: Product) => item.menu_category_id === category.category_id,
					)
					return { ...category, items: categoryItems }
				})
				.sort((a, b) => {
					const indexA = CATEGORY_ORDER.indexOf(a.category_name)
					const indexB = CATEGORY_ORDER.indexOf(b.category_name)

					// If both categories are in the order list, sort by their index
					if (indexA !== -1 && indexB !== -1) {
						return indexA - indexB
					}

					// If only A is in the order list, it comes first
					if (indexA !== -1) return -1

					// If only B is in the order list, it comes first
					if (indexB !== -1) return 1

					// If neither is in the order list, sort alphabetically
					return a.category_name.localeCompare(b.category_name)
				})
				.filter((category) => category.items.length > 0),
		[categories, menu],
	)

	const handleAddToBag = (item: Product) => {
		addItem({ id: item.product_id, quantity: 1 })
	}

	const renderMenuItem = ({ item }: { item: Product }) => (
		<ErrorBoundary fallback={menuItemFallback}>
			<MenuListItem item={item} onAddToBag={handleAddToBag} />
		</ErrorBoundary>
	)

	useEffect(() => {
		if (!selfData) return

		async function requestEnableAnalytics() {
			const granted = await requestTrackingPermissionAsync()

			if (!granted) return

			void enableAnalytics({
				email: selfData?.email,
				firstName: selfData?.firstname,
				lastName: selfData?.lastname,
				phoneNumber: selfData?.phone_number,
				userId: selfData?.client_id,
			})
		}

		void requestEnableAnalytics()
	}, [selfData])

	const renderCategorySection = (
		category: Category & { items: Product[] },
		_index: number,
	) => (
		<Fragment key={category.category_id}>
			<H3 style={styles.subtitle}>{category.category_name}</H3>
			<FlatList
				contentContainerStyle={styles.categoryItems}
				data={category.items}
				horizontal
				keyExtractor={categoryKeyExtractor}
				renderItem={renderMenuItem}
				showsHorizontalScrollIndicator={false}
			/>
		</Fragment>
	)

	if (menu.length === 0) {
		if (isFetching) {
			return (
				<View style={styles.loadingContainer}>
					<UniActivityIndicator size="large" />
					<Paragraph style={styles.loadingText}>
						<Trans>Loading menu...</Trans>
					</Paragraph>
				</View>
			)
		}

		if (error) {
			return (
				<View style={styles.errorContainer}>
					<Paragraph style={styles.errorText}>
						<Trans>Failed to load menu. Please try again.</Trans>
					</Paragraph>
					<Button>
						<Trans>Retry</Trans>
					</Button>
				</View>
			)
		}
	}

	return (
		<>
			<Head>
				<title>{t`Menu - TOLO Good Coffee`}</title>
				<meta
					content={t`Discover our homemade coffee menu with espresso, lattes, cappuccinos and delicious sides. TOLO - where good coffee meets you.`}
					name="description"
				/>
				<meta
					content={t`TOLO menu, good coffee, espresso, latte, cappuccino, coffee shop menu`}
					name="keywords"
				/>
				<meta content={t`Menu - TOLO Good Coffee`} property="og:title" />
				<meta
					content={t`Discover our homemade coffee menu with espresso, lattes, cappuccinos and delicious sides.`}
					property="og:description"
				/>
				<meta content="/" property="og:url" />
			</Head>
			<ScreenContainer
				contentInsetAdjustmentBehavior="automatic"
				ref={screenRef}
				refreshControl={
					<RefreshControl
						onRefresh={() =>
							queryClient.invalidateQueries(productsQueryOptions)
						}
						refreshing={false}
					/>
				}
				withTopGradient
				withTopPadding
			>
				{/* Coffee Stories Section */}
				{coffees.length > 0 && (
					<View style={styles.storiesSection}>
						<H2 style={styles.storiesTitle}>
							<Trans>Our Beans</Trans>
						</H2>
						<FlatList
							contentContainerStyle={styles.storiesContainer}
							data={coffees}
							horizontal
							keyExtractor={(item) => item.slug}
							renderItem={({ item }) => <CoffeeStoryBubble coffee={item} />}
							showsHorizontalScrollIndicator={false}
						/>
					</View>
				)}

				<View style={styles.categoryTitle}>
					<H2>
						<Trans>Menu</Trans>
					</H2>
				</View>
				{categoriesWithItems.map((category, index) =>
					renderCategorySection(category, index),
				)}
				<Paragraph style={styles.disclaimer} align="center">
					<Trans>
						Prices are subject to change without notice.{'\n'}Calories and
						volume are approximate and may vary between preparations.
					</Trans>
				</Paragraph>
			</ScreenContainer>
		</>
	)
}

const UniIonicons = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.background,
}))

function MenuListItem({
	item,
	onAddToBag,
}: {
	item: Product
	onAddToBag: (item: Product) => void
}) {
	const scale = useSharedValue(1)
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}))

	const cost = getProductBaseCost(item, true)

	return (
		<Link asChild href={`/(tabs)/(home)/${item.product_id}`}>
			<AnimatedPressable
				onPressIn={() => {
					scale.value = withSpring(0.96)
				}}
				onPressOut={() => {
					scale.value = withSpring(1)
				}}
				style={animatedStyle}
			>
				<Card padded={false} style={styles.menuItem}>
					<View style={styles.menuItemImageContainer}>
						{item.photo ? (
							<UniImage
								contentFit="cover"
								placeholder={{
									cacheKey: `${item.product_id}-placeholder`,
									uri: getImageUrl(item.photo, {
										blur: 100,
										quality: 20,
										width: 350,
									}),
								}}
								placeholderContentFit="cover"
								source={{
									uri: getImageUrl(item.photo, {
										quality: 85,
										width: 400,
									}),
								}}
								style={styles.image}
								transition={200}
							/>
						) : (
							<View style={styles.menuItemImage} aria-hidden />
						)}
					</View>
					<View style={styles.menuItemContent}>
						<H4 numberOfLines={2}>{item.product_name}</H4>
						{item.product_production_description ? (
							<Text>{item.product_production_description}</Text>
						) : null}
						<View style={styles.menuItemFooter}>
							<Text>
								{'modifications' in item ? <Trans>From {cost}</Trans> : cost}
							</Text>
							<View style={styles.menuItemActions}>
								<TouchableOpacity
									disabled={!cost}
									onPress={(event) => {
										event.stopPropagation()
										onAddToBag(item)
									}}
									style={styles.addToBagButton}
								>
									<UniIonicons name="add" size={26} />
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Card>
			</AnimatedPressable>
		</Link>
	)
}

function CoffeeStoryBubble({ coffee }: { coffee: Coffee }) {
	const scale = useSharedValue(1)
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}))

	// Get a gradient color based on coffee name hash
	const gradientIndex =
		coffee.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5
	const gradientColors = (
		[
			['#8B4513', '#D2691E'], // Brown/Tan
			['#4A2511', '#6F4E37'], // Dark Brown
			['#654321', '#8B6914'], // Coffee Brown to Gold
			['#3E2723', '#5D4037'], // Dark Coffee
			['#3C1A1A', '#6D3838'], // Reddish Brown
		] as const
	)[gradientIndex]

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
								end={{ x: 1, y: 1 }}
								start={{ x: 0, y: 0 }}
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
	addToBagButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.verde.solid,
		borderRadius: theme.borderRadius.full,
		height: 36,
		justifyContent: 'center',
		width: 36,
	},
	disclaimer: {
		padding: theme.layout.screenPadding,
		fontSize: theme.fontSizes.sm,
		color: theme.colors.gray.solid,
	},
	categoryItems: {
		gap: theme.spacing.sm,
		overflow: 'visible',
		paddingBottom: theme.spacing.lg,
		paddingHorizontal: theme.layout.screenPadding,
		paddingTop: theme.spacing.md,
	},
	categoryTitle: {
		color: theme.colors.gray.text,
		marginBottom: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
	},
	errorContainer: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		flex: 1,
		gap: theme.spacing.lg,
		justifyContent: 'center',
		padding: theme.spacing.xl,
	},
	errorText: {
		color: theme.colors.rojo.solid,
		textAlign: 'center',
	},
	image: {
		height: '100%',
		objectFit: 'cover',
		width: '100%',
	},
	loadingContainer: {
		alignItems: 'center',
		backgroundColor: theme.colors.crema.background,
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
	},
	loadingText: {
		color: theme.colors.crema.solid,
	},
	menuItem: {
		flex: 1,
		width: ITEM_SIZE,
	},
	menuItemActions: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	menuItemContent: {
		flex: 1,
		gap: theme.spacing.xs,
		justifyContent: 'space-between',
		padding: 10,
		paddingVertical: theme.spacing.sm,
	},
	menuItemFooter: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	menuItemImage: {
		height: '100%',
		width: '100%',
	},
	menuItemImageContainer: {
		backgroundColor: theme.colors.gray.border,
		borderCurve: 'continuous',
		borderTopLeftRadius: theme.borderRadius.lg,
		borderTopRightRadius: theme.borderRadius.lg,
		height: ITEM_SIZE,
		overflow: 'hidden',
		width: '100%',
	},
	storiesContainer: {
		gap: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
		paddingVertical: theme.spacing.md,
	},
	storiesSection: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
		paddingBottom: theme.spacing.lg,
	},
	storiesTitle: {
		paddingHorizontal: theme.layout.screenPadding,
	},
	storyBubble: {
		alignItems: 'center',
		gap: theme.spacing.xs,
		width: 80,
	},
	storyBubbleImageContainer: {
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.full,
		height: 64,
		overflow: 'hidden',
		width: 64,
	},
	storyBubbleRing: {
		alignItems: 'center',
		borderColor: theme.colors.verde.solid,
		borderRadius: theme.borderRadius.full,
		borderWidth: 3,
		justifyContent: 'center',
		padding: 3,
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
	storyBubbleText: {
		fontSize: theme.fontSizes.sm,
		textAlign: 'center',
	},
	subtitle: {
		paddingHorizontal: theme.layout.screenPadding,
	},
}))
