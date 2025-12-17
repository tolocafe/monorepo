import { FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import CoffeeStoryBubble, { BUBBLE_SIZE } from '@/components/CoffeeStoryBubble'
import { H2 } from '@/components/Text'
import { coffeesQueryOptions } from '@/lib/queries/coffees'

import type { Coffee } from '@/lib/api'

const UniFlatList = withUnistyles(FlatList)

const handleGetItemLayout = (_item: unknown, index: number) => ({
	index,
	length: BUBBLE_SIZE,
	offset: BUBBLE_SIZE * index,
})

const handleRenderItem = ({ item }: { item: unknown }) => (
	<CoffeeStoryBubble coffee={item as Coffee} />
)

const handleKeyExtractor = (item: unknown) => (item as Coffee).slug

export function CoffeesSection() {
	const { data } = useQuery(coffeesQueryOptions)

	if (!data?.length) {
		return null
	}

	return (
		<View style={styles.storiesSection}>
			<H2 style={styles.storiesTitle}>
				<Trans>Our Beans</Trans>
			</H2>
			<UniFlatList
				contentContainerStyle={styles.storiesContainer}
				data={data}
				getItemLayout={handleGetItemLayout}
				horizontal
				keyExtractor={handleKeyExtractor}
				renderItem={handleRenderItem}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	storiesContainer: {
		gap: theme.spacing.sm,
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
		paddingVertical: theme.spacing.md,
	},
	storiesSection: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
	},
	storiesTitle: {
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
	},
}))
