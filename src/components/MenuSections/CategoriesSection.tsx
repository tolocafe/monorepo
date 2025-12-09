import { Fragment, useMemo } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { ErrorBoundary } from '@sentry/react-native'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import MenuListItem from '@/components/MenuListItem'
import { H2, H3, Paragraph } from '@/components/Text'
import {
	categoriesQueryOptions,
	productsQueryOptions,
} from '@/lib/queries/menu'

import type { Product } from '@/lib/api'

const UniActivityIndicator = withUnistyles(ActivityIndicator, (theme) => ({
	color: theme.colors.gray.solid,
}))

const CATEGORY_ORDER = ['De Temporada', 'Café', 'Matcha', 'Té y Tisanas']
const categoryKeyExtractor = (item: Product) => item.product_id
const menuItemFallback = <View aria-hidden />

export function CategoriesSection() {
	const productsQuery = useQuery(productsQueryOptions)
	const categoriesQuery = useQuery(categoriesQueryOptions)

	const menu = productsQuery.data
	const categories = categoriesQuery.data

	const categoriesWithItems = useMemo(
		() =>
			categories
				.map((category) => {
					const categoryItems = menu.filter(
						(item: Product) =>
							item.menu_category_id === category.category_id &&
							item.hidden !== '1',
					)
					return { ...category, items: categoryItems }
				})
				// eslint-disable-next-line unicorn/no-array-sort
				.sort((a, b) => {
					const indexA = CATEGORY_ORDER.indexOf(a.category_name)
					const indexB = CATEGORY_ORDER.indexOf(b.category_name)

					if (indexA !== -1 && indexB !== -1) return indexA - indexB
					if (indexA !== -1) return -1
					if (indexB !== -1) return 1
					return a.category_name.localeCompare(b.category_name)
				})
				.filter((category) => category.items.length > 0),
		[categories, menu],
	)

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
			<View style={styles.categoryTitle}>
				<H2>
					<Trans>Menu</Trans>
				</H2>
			</View>
			{categoriesWithItems.map((category) => (
				<Fragment key={category.category_id}>
					<H3 style={styles.subtitle}>{category.category_name}</H3>
					<FlatList
						contentContainerStyle={styles.categoryItems}
						data={category.items}
						horizontal
						keyExtractor={categoryKeyExtractor}
						renderItem={({ item }) => (
							<ErrorBoundary fallback={menuItemFallback}>
								<MenuListItem item={item} />
							</ErrorBoundary>
						)}
						showsHorizontalScrollIndicator={false}
					/>
				</Fragment>
			))}
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
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
	subtitle: {
		paddingHorizontal: theme.layout.screenPadding,
	},
}))
