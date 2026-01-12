import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { FlatList } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import CoffeeStoryBubble, { BUBBLE_SIZE } from '@/components/CoffeeStoryBubble'
import { H2 } from '@/components/Text'
import type { Coffee } from '@/lib/api'
import { coffeesQueryOptions } from '@/lib/queries/coffees'

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
		<>
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
		</>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	storiesContainer: {
		gap: theme.spacing.sm,
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
		paddingVertical: theme.spacing.md,
	},
	storiesTitle: {
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
	},
}))
