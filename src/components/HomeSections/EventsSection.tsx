import { FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { ErrorBoundary } from '@sentry/react-native'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import EventCard from '@/components/EventCard'
import { H2 } from '@/components/Text'
import { eventsQueryOptions } from '@/lib/queries/events'

import type { Event } from '~common/api'

const UniFlatList = withUnistyles(FlatList)

const eventItemFallback = <View aria-hidden />

const handleKeyExtractor = (item: unknown) => (item as Event).slug

const handleRenderItem = ({ item }: { item: unknown }) => (
	<ErrorBoundary fallback={eventItemFallback}>
		<EventCard event={item as Event} />
	</ErrorBoundary>
)

export function EventsSection() {
	const { data } = useQuery(eventsQueryOptions)

	if (!data?.length) {
		return null
	}

	return (
		<View style={styles.eventsSection}>
			<H2 style={styles.eventsTitle}>
				<Trans>Events</Trans>
			</H2>
			<UniFlatList
				contentContainerStyle={styles.eventsContainer}
				data={data}
				horizontal
				keyExtractor={handleKeyExtractor}
				renderItem={handleRenderItem}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	eventsContainer: {
		gap: theme.spacing.md,
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
		paddingVertical: theme.spacing.md,
	},
	eventsSection: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
	},
	eventsTitle: {
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
	},
}))
