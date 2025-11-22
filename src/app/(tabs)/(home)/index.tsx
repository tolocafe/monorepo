import { Fragment, useEffect, useMemo, useRef } from 'react'
import type { ScrollView } from 'react-native'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { ErrorBoundary } from '@sentry/react-native'
import { useQuery } from '@tanstack/react-query'
import Head from 'expo-router/head'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import CoffeeStoryBubble from '@/components/CoffeeStoryBubble'
import MenuListItem from '@/components/MenuListItem'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph } from '@/components/Text'
import { enableAnalytics } from '@/lib/analytics/firebase'
import { requestTrackingPermissionAsync } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'
import { coffeesQueryOptions } from '@/lib/queries/coffees'
import {
	categoriesQueryOptions,
	productsQueryOptions,
} from '@/lib/queries/menu'
import { queryClient } from '@/lib/query-client'
import { useAddItemGuarded } from '@/lib/stores/order-store'

import type { Category, Coffee, Product } from '@/lib/api'

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
				// eslint-disable-next-line unicorn/no-array-sort
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

	const renderCoffeeStory = ({ item }: { item: Coffee }) => (
		<CoffeeStoryBubble coffee={item} />
	)

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
							renderItem={renderCoffeeStory}
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
				<Paragraph align="center" style={styles.disclaimer}>
					<Trans>
						Prices are subject to change without notice.{'\n'}Calories and
						volume are approximate and may vary between preparations.
					</Trans>
				</Paragraph>
			</ScreenContainer>
		</>
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
	disclaimer: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.sm,
		padding: theme.layout.screenPadding,
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
		gap: theme.spacing.sm,
		paddingHorizontal: theme.layout.screenPadding,
		paddingVertical: theme.spacing.md,
	},
	storiesSection: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
	},
	storiesTitle: {
		paddingHorizontal: theme.layout.screenPadding,
	},
	storyBubble: {
		alignItems: 'center',
		gap: theme.spacing.xs,
		width: 80,
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
	storyBubbleText: {
		fontSize: theme.fontSizes.sm,
		textAlign: 'center',
	},
	subtitle: {
		paddingHorizontal: theme.layout.screenPadding,
	},
}))
