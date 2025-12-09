import { FlatList, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet } from 'react-native-unistyles'

import EventCard from '@/components/EventCard'
import { H2 } from '@/components/Text'
import { eventsQueryOptions } from '@/lib/queries/events'

export function EventsSection() {
	const { data } = useQuery(eventsQueryOptions)

	if (data.length === 0) {
		return <h1>NO DATA</h1>
	}

	return (
		<View style={styles.eventsSection}>
			<H2 style={styles.eventsTitle}>
				<Trans>Events</Trans>
			</H2>
			<FlatList
				contentContainerStyle={styles.eventsContainer}
				data={data}
				horizontal
				keyExtractor={(item) => item.slug}
				renderItem={({ item }) => <EventCard event={item} />}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	eventsContainer: {
		gap: theme.spacing.md,
		paddingHorizontal: theme.layout.screenPadding,
		paddingVertical: theme.spacing.md,
	},
	eventsSection: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
	},
	eventsTitle: {
		paddingHorizontal: theme.layout.screenPadding,
	},
}))
