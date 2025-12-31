import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { FlatList, View } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import EventCard from '@/components/EventCard'
import { H2, Paragraph } from '@/components/Text'
import { eventsQueryOptions } from '@/lib/queries/events'
import type { Event } from '~common/api'

const UniFlatList = withUnistyles(FlatList)

export function EventsSection() {
	const { data } = useQuery(eventsQueryOptions)

	const hasEvents = data && data.length > 0

	return (
		<View style={styles.eventsSection}>
			<H2 style={styles.eventsTitle}>
				<Trans>Events</Trans>
			</H2>
			{hasEvents ? (
				<UniFlatList
					contentContainerStyle={styles.eventsContainer}
					data={data}
					horizontal
					keyExtractor={(item) => (item as Event).slug}
					renderItem={({ item }) => <EventCard event={item as Event} />}
					showsHorizontalScrollIndicator={false}
				/>
			) : (
				<View style={styles.emptyState}>
					<Paragraph style={styles.emptyText}>
						<Trans>No events scheduled at the moment</Trans>
					</Paragraph>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	emptyState: {
		alignItems: 'center',
		paddingHorizontal: Math.max(
			runtime.insets.left,
			theme.layout.screenPadding,
		),
		paddingVertical: theme.spacing.xl,
	},
	emptyText: {
		color: theme.colors.crema.text,
		textAlign: 'center',
	},
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
