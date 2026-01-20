import { queryOptions } from '@tanstack/react-query'

import { api } from '~/lib/services/api-service'

export const coffeesQueryOptions = queryOptions({
	placeholderData: [],
	queryFn: api.coffees.getCoffees,
	queryKey: ['coffees'] as const,
})

export const coffeeQueryOptions = (slug: string) =>
	queryOptions({
		queryFn: () => api.coffees.getCoffee(slug),
		queryKey: ['coffees', slug] as const,
	})
