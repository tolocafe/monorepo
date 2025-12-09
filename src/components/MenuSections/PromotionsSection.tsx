import { FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet } from 'react-native-unistyles'

import PromotionCard from '@/components/PromotionCard'
import { H2 } from '@/components/Text'
import { promotionsQueryOptions } from '@/lib/queries/menu'

export function PromotionsSection() {
	const { data } = useQuery(promotionsQueryOptions)
	if (data.length === 0) return null

	return (
		<View style={styles.promotionsSection}>
			<H2 style={styles.promotionsTitle}>
				<Trans>Promotions</Trans>
			</H2>
			<FlatList
				contentContainerStyle={styles.promotionsContainer}
				data={data}
				horizontal
				keyExtractor={(item) => item.promotion_id}
				renderItem={({ item }) => <PromotionCard promotion={item} />}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	promotionsContainer: {
		gap: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
		paddingVertical: theme.spacing.md,
	},
	promotionsSection: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
	},
	promotionsTitle: {
		paddingHorizontal: theme.layout.screenPadding,
	},
}))
