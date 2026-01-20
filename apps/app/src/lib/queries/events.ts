import { queryOptions } from '@tanstack/react-query'

import { queryClient } from '~/lib/query-client'
import { api } from '~/lib/services/api-service'

export const eventsQueryOptions = queryOptions({
	placeholderData: [],
	queryFn: api.events.getEvents,
	queryKey: ['events'] as const,
})

export const eventQueryOptions = (id: string) =>
	queryOptions({
		enabled: Boolean(id),
		placeholderData: () => {
			const event = queryClient
				.getQueryData(eventsQueryOptions.queryKey)
				?.find((event) => event.id === id)

			return event
		},
		queryFn: () => api.events.getEvent(id),
		queryKey: ['events', id] as const,
	})
