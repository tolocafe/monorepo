import { FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet } from 'react-native-unistyles'

import CoffeeStoryBubble from '@/components/CoffeeStoryBubble'
import { H2 } from '@/components/Text'
import { coffeesQueryOptions } from '@/lib/queries/coffees'

export function CoffeesSection() {
	const { data } = useQuery(coffeesQueryOptions)
	if (data.length === 0) return null

	return (
		<View style={styles.storiesSection}>
			<H2 style={styles.storiesTitle}>
				<Trans>Our Beans</Trans>
			</H2>
			<FlatList
				contentContainerStyle={styles.storiesContainer}
				data={data}
				horizontal
				keyExtractor={(item) => item.slug}
				renderItem={({ item }) => <CoffeeStoryBubble coffee={item} />}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
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
}))
