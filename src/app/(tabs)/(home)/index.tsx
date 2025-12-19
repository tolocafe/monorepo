import { useCallback, useEffect, useRef } from 'react'
import type { ScrollView } from 'react-native'
import { RefreshControl } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import {
	CategoriesSection,
	CoffeesSection,
	EventsSection,
	PromotionsSection,
	SectionErrorBoundary,
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
import { enableAnalytics } from '@/lib/analytics/firebase'
import { requestTrackingPermissionAsync } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'
import { queryClient } from '@/lib/query-client'

export default function Menu() {
	const { t } = useLingui()

	const { data: selfData } = useQuery(selfQueryOptions)

	const screenRef = useRef<ScrollView>(null)

	useScrollToTop(screenRef)

	useEffect(() => {
		if (!selfData) return

		async function requestEnableAnalytics() {
			const granted = await requestTrackingPermissionAsync()

			if (!granted) return

			void enableAnalytics({
				email: selfData?.email,
				firstName: selfData?.firstname,
				lastName: selfData?.lastname,
				phoneNumber: selfData?.phone_number,
				userId: selfData?.client_id,
			})
		}

		void requestEnableAnalytics()
	}, [selfData])

	const handleRefresh = useCallback(() => {
		void queryClient.invalidateQueries(productsQueryOptions)
		void queryClient.invalidateQueries(categoriesQueryOptions)
		void queryClient.invalidateQueries(promotionsQueryOptions)
		void queryClient.invalidateQueries(coffeesQueryOptions)
		void queryClient.invalidateQueries(eventsQueryOptions)
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
				<SectionErrorBoundary>
					<PromotionsSection />
				</SectionErrorBoundary>

				<SectionErrorBoundary>
					<CategoriesSection />
				</SectionErrorBoundary>

				<SectionErrorBoundary>
					<CoffeesSection />
				</SectionErrorBoundary>

				<SectionErrorBoundary>
					<EventsSection />
				</SectionErrorBoundary>

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
