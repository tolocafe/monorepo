import { Trans } from '@lingui/react/macro'
import { ErrorBoundary } from '@sentry/react-native'
import { useQuery } from '@tanstack/react-query'
import type { Product } from '@tolo/common/api'
import { Fragment, useMemo } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { StyleSheet, useUnistyles, withUnistyles } from 'react-native-unistyles'

import Button from '@/components/Button'
import MenuListItem, { getItemSize } from '@/components/MenuListItem'
import { H2, H3, Paragraph } from '@/components/Text'
import {
	categoriesQueryOptions,
	productsQueryOptions,
} from '@/lib/queries/menu'

const UniActivityIndicator = withUnistyles(ActivityIndicator, (theme) => ({
	color: theme.colors.gray.solid,
}))

const CATEGORY_ORDER = ['De Temporada', 'Café', 'Matcha', 'Té y Tisanas']

const categoryKeyExtractor = (item: unknown) => (item as Product).product_id

const menuItemFallback = <View aria-hidden />

const UniFlatList = withUnistyles(FlatList)

const handleRenderItem = ({ item }: { item: unknown }) => (
	<ErrorBoundary fallback={menuItemFallback}>
		<MenuListItem item={item as Product} />
	</ErrorBoundary>
)

export function MenuSection() {
	const productsQuery = useQuery(productsQueryOptions)
	const categoriesQuery = useQuery(categoriesQueryOptions)
	const { rt } = useUnistyles()

	const menu = productsQuery.data
	const categories = categoriesQuery.data

	const handleGetItemLayout = (_item: unknown, index: number) => ({
		index,
		length: getItemSize(rt.screen.width),
		offset: getItemSize(rt.screen.width) * index,
	})

	const categoriesWithItems = useMemo(() => {
		if (!categories || !menu) return []

		return (
			categories
				.map((category) => ({
					...category,
					items: menu.filter(
						(item) => item.menu_category_id === category.category_id,
					),
				}))
				// eslint-disable-next-line unicorn/no-array-sort
				.sort((a, b) => {
					const indexA = CATEGORY_ORDER.indexOf(a.category_name)
					const indexB = CATEGORY_ORDER.indexOf(b.category_name)

					if (indexA !== -1 && indexB !== -1) return indexA - indexB
					if (indexA !== -1) return -1
					if (indexB !== -1) return 1
					return a.category_name.localeCompare(b.category_name)
				})
				.filter((category) => category.items.length > 0)
		)
	}, [categories, menu])

	if (categoriesWithItems.length === 0) {
		if (productsQuery.isFetching) {
			return (
				<View style={styles.loadingContainer}>
					<UniActivityIndicator size="large" />
					<Paragraph style={styles.loadingText}>
						<Trans>Loading menu...</Trans>
					</Paragraph>
				</View>
			)
		}

		if (productsQuery.error) {
			return (
				<View style={styles.errorContainer}>
					<Paragraph weight="bold" style={styles.errorText}>
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
			<View style={styles.categoryTitle}>
				<H2>
					<Trans>Menu</Trans>
				</H2>
			</View>
			{categoriesWithItems.map((category) => (
				<Fragment key={category.category_id}>
					<H3 style={styles.categorySubtitle}>{category.category_name}</H3>
					<UniFlatList
						contentContainerStyle={styles.categoryItems}
						data={category.items}
						getItemLayout={handleGetItemLayout}
						horizontal
						keyExtractor={categoryKeyExtractor}
						renderItem={handleRenderItem}
						showsHorizontalScrollIndicator={false}
					/>
				</Fragment>
			))}
		</>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	categoryItems: {
		gap: theme.spacing.sm,
		overflow: 'visible',
		paddingBottom: theme.spacing.lg,
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
		paddingTop: theme.spacing.md,
	},
	categorySubtitle: {
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
	},
	categoryTitle: {
		color: theme.colors.gray.text,
		marginBottom: theme.spacing.md,
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
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
		color: theme.colors.error.solid,
		textAlign: 'center',
	},
	loadingContainer: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
	},
	loadingText: {
		color: theme.colors.gray.solid,
	},
}))
