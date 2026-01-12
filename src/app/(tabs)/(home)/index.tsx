import { Trans, useLingui } from '@lingui/react/macro'
import { Stack, router } from 'expo-router'
import Head from 'expo-router/head'
import { useCallback } from 'react'
import { Platform, RefreshControl } from 'react-native'
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
import ScreenContainer from '@/components/ScreenContainer'
import Text, { Paragraph } from '@/components/Text'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { isIOS20 } from '@/lib/constants/ui'
import { queryClient } from '@/lib/query-client'

export default function MenuScreen() {
	const { t } = useLingui()

	useTrackScreenView({ screenName: 'home' }, [])

	const handleRefresh = useCallback(
		() =>
			void Promise.allSettled([
				queryClient.invalidateQueries(productsQueryOptions),
				queryClient.invalidateQueries(categoriesQueryOptions),
				queryClient.invalidateQueries(promotionsQueryOptions),
				queryClient.invalidateQueries(coffeesQueryOptions),
				queryClient.invalidateQueries(eventsQueryOptions),
			]),
		[],
	)

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

			<Stack.Header>
				<Stack.Header.Title>{t`Home`}</Stack.Header.Title>
				<Stack.Header.Right>
					{Platform.OS === 'ios' ? (
						<Stack.Header.Button
							onPress={() => router.navigate('/orders/current')}
							icon="storefront"
						/>
					) : (
						<Stack.Header.View>
							<Text>Hello</Text>
						</Stack.Header.View>
					)}
				</Stack.Header.Right>
			</Stack.Header>

			<ScreenContainer
				withPaddingEdges={isIOS20 ? ['bottom'] : ['bottom', 'top']}
				refreshControl={
					<RefreshControl onRefresh={handleRefresh} refreshing={false} />
				}
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
			</ScreenContainer>
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
