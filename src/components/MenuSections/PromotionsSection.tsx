import { FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import type { Promotion } from '@common/api'

import PromotionCard from '@/components/PromotionCard'
import { H2 } from '@/components/Text'
import { promotionsQueryOptions } from '@/lib/queries/menu'

const UniFlatList = withUnistyles(FlatList)

export function PromotionsSection() {
	const { data } = useQuery(promotionsQueryOptions)

	if (data.length === 0) {
		return null
	}

	return (
		<View style={styles.promotionsSection}>
			<H2 style={styles.promotionsTitle}>
				<Trans>Promotions</Trans>
			</H2>
			<UniFlatList
				contentContainerStyle={styles.promotionsContainer}
				data={data}
				horizontal
				keyExtractor={(item) => (item as Promotion).promotion_id}
				renderItem={({ item }) => (
					<PromotionCard promotion={item as Promotion} />
				)}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	promotionsContainer: {
		gap: theme.spacing.md,
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
		paddingVertical: theme.spacing.md,
	},
	promotionsSection: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
	},
	promotionsTitle: {
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
	},
}))
