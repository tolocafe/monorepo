import { FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import type { Event } from '@common/api'

import EventCard from '@/components/EventCard'
import { H2 } from '@/components/Text'
import { eventsQueryOptions } from '@/lib/queries/events'

const UniFlatList = withUnistyles(FlatList)

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
				keyExtractor={(item) => (item as Event).slug}
				renderItem={({ item }) => <EventCard event={item as Event} />}
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
