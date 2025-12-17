import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

export const eventsQueryOptions = queryOptions({
	placeholderData: [],
	queryFn: api.events.getEvents,
	queryKey: ['events'] as const,
})

export const eventQueryOptions = (slug: string) =>
	queryOptions({
		queryFn: () => api.events.getEvent(slug),
		queryKey: ['events', slug] as const,
	})
