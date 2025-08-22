import { useEffect, useRef } from 'react'
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
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import Head from 'expo-router/head'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ScreenContainer } from '@/components/ScreenContainer'
import { H2, H3, H4, Paragraph } from '@/components/Text'
import { getImageUrl } from '@/lib/image'
import { requestTrackingPermissionAsync } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'
import {
	categoriesQueryOptions,
	productsQueryOptions,
} from '@/lib/queries/menu'
import { queryClient } from '@/lib/query-client'
import { useAddItemGuarded } from '@/lib/stores/order-store'
import { formatPrice } from '@/lib/utils/price'

import type { Category, Product } from '@/lib/api'

export default function Menu() {
	const { t } = useLingui()
	const addItem = useAddItemGuarded()
	const { data: selfData } = useQuery(selfQueryOptions)

	const screenRef = useRef<ScrollView>(null)

	useScrollToTop(screenRef)

	const { data: menu, error, isFetching } = useQuery(productsQueryOptions)
	const { data: categories } = useQuery(categoriesQueryOptions)

	const handleAddToBag = (item: Product) => {
		addItem({ id: item.product_id, quantity: 1 })
	}

	const renderMenuItem = ({ item }: { item: Product }) => (
		<MenuListItem item={item} onAddToBag={handleAddToBag} />
	)

	useEffect(() => {
		if (!selfData) return
		void requestTrackingPermissionAsync()
	}, [selfData])

	const renderCategorySection = (category: Category) => {
		const categoryItems = menu.filter(
			(item: Product) => item.menu_category_id === category.category_id,
		)

		if (categoryItems.length === 0) return null

		return (
			<View key={category.category_id} style={styles.categorySection}>
				<H3 style={styles.subtitle}>{category.category_name}</H3>
				<FlatList
					contentContainerStyle={styles.categoryItems}
					data={categoryItems}
					horizontal
					keyExtractor={(item) => item.product_id}
					renderItem={renderMenuItem}
					showsHorizontalScrollIndicator={false}
				/>
			</View>
		)
	}

	if (menu.length === 0) {
		if (isFetching) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" />
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
				<View style={styles.categoryTitle}>
					<H2>
						<Trans>Menu</Trans>
					</H2>
				</View>
				{categories.map((category) => renderCategorySection(category))}
			</ScreenContainer>
		</>
	)
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

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

	const firstPrice = Object.values(item.price)[0]

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
					<Animated.View
						sharedTransitionTag={`menu-item-${item.product_id}`}
						style={styles.menuItemImageContainer}
					>
						{item.photo ? (
							<Image
								contentFit="cover"
								placeholder={{
									uri: getImageUrl(item.photo, {
										blur: 50,
										quality: 50,
										width: 300,
									}),
								}}
								source={{
									uri: getImageUrl(item.photo, {
										quality: 90,
										width: 300,
									}),
								}}
								style={{ height: '100%', objectFit: 'cover', width: '100%' }}
								transition={200}
							/>
						) : (
							<View style={styles.menuItemImage} />
						)}
					</Animated.View>
					<View style={styles.menuItemContent}>
						<View style={styles.menuItemHeader}>
							<H4>{item.product_name}</H4>
						</View>
						<Paragraph>{item.product_production_description}</Paragraph>
						<View style={styles.menuItemFooter}>
							<Paragraph>{formatPrice(firstPrice)}</Paragraph>
							<View style={styles.menuItemActions}>
								<TouchableOpacity
									onPress={(event) => {
										event.stopPropagation()
										onAddToBag(item)
									}}
									style={styles.addToBagButton}
								>
									<Ionicons color="#fff" name="add" size={24} />
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Card>
			</AnimatedPressable>
		</Link>
	)
}

const styles = StyleSheet.create((theme) => ({
	addToBagButton: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.full,
		padding: theme.spacing.sm,
	},
	badge: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.sm,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 2,
	},
	badges: {
		flexDirection: 'row',
		gap: theme.spacing.xs,
	},
	badgeText: {
		color: theme.colors.surface,
	},
	categoryItems: {
		gap: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
	},
	categorySection: {
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.xl,
	},
	categoryTitle: {
		color: theme.colors.text,
		marginBottom: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
	},
	errorContainer: {
		alignItems: 'center',
		backgroundColor: theme.colors.background,
		flex: 1,
		gap: theme.spacing.lg,
		justifyContent: 'center',
		padding: theme.spacing.xl,
	},
	errorText: {
		color: theme.colors.error,
		textAlign: 'center',
	},
	header: {
		alignItems: 'center',
		padding: theme.spacing.lg,
	},
	loadingContainer: {
		alignItems: 'center',
		backgroundColor: theme.colors.background,
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
	},
	loadingText: {
		color: theme.colors.textSecondary,
	},

	menuItem: {
		overflow: 'hidden',
		width: 225,
	},
	menuItemActions: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	menuItemContent: {
		padding: theme.spacing.md,
	},
	menuItemFooter: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: theme.spacing.md,
	},
	menuItemHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.xs,
	},
	menuItemImage: {
		height: 225,
		width: '100%',
	},
	menuItemImageContainer: {
		backgroundColor: theme.colors.border,
		height: 225,
		width: '100%',
	},
	subtitle: {
		paddingHorizontal: theme.layout.screenPadding,
	},
	theme,
	title: {
		color: theme.colors.primary,
	},
}))
