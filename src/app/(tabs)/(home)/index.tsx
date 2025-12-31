import { Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import Head from 'expo-router/head'
import { useCallback, useRef } from 'react'
import { RefreshControl } from 'react-native'
import type { ScrollView } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import {
	CoffeesSection,
	EventsSection,
	MenuSection,
	PromotionsSection,
} from '@/components/HomeSections'
import {
	categoriesQueryOptions,
	coffeesQueryOptions,
	eventsQueryOptions,
	productsQueryOptions,
	promotionsQueryOptions,
} from '@/components/HomeSections/queries'
import { TabScreenContainer } from '@/components/ScreenContainer'
import { Paragraph } from '@/components/Text'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { queryClient } from '@/lib/query-client'

export default function MenuScreen() {
	const { t } = useLingui()

	const screenRef = useRef<ScrollView>(null)

	useScrollToTop(screenRef)
	useTrackScreenView({ screenName: 'home' }, [])

	const handleRefresh = useCallback(() => {
		return Promise.allSettled([
			queryClient.invalidateQueries(productsQueryOptions),
			queryClient.invalidateQueries(categoriesQueryOptions),
			queryClient.invalidateQueries(promotionsQueryOptions),
			queryClient.invalidateQueries(coffeesQueryOptions),
			queryClient.invalidateQueries(eventsQueryOptions),
		])
	}, [])

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
			<TabScreenContainer
				ref={screenRef}
				refreshControl={
					<RefreshControl onRefresh={handleRefresh} refreshing={false} />
				}
				withPaddingEdges={['top', 'bottom']}
				withTopGradient
			>
				<PromotionsSection />

				<MenuSection />

				<CoffeesSection />

				<EventsSection />

				<Paragraph align="center" style={styles.disclaimer}>
					<Trans>
						Prices are subject to change without notice.{'\n'}Calories and
						volume are approximate and may vary between preparations.
					</Trans>
				</Paragraph>
			</TabScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	disclaimer: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.sm,
		padding: theme.layout.screenPadding,
	},
}))
