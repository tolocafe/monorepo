import { FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import CoffeeStoryBubble from '@/components/CoffeeStoryBubble'
import { H2 } from '@/components/Text'
import { coffeesQueryOptions } from '@/lib/queries/coffees'

import type { Coffee } from '@/lib/api'

const UniFlatList = withUnistyles(FlatList)

export function CoffeesSection() {
	const { data } = useQuery(coffeesQueryOptions)

	if (data.length === 0) {
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
				horizontal
				keyExtractor={(item) => (item as Coffee).slug}
				renderItem={({ item }) => <CoffeeStoryBubble coffee={item as Coffee} />}
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
