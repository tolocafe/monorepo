import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

export const coffeesQueryOptions = queryOptions({
	queryFn: () => api.coffees.getCoffees(),
	queryKey: ['coffees'],
	staleTime: 1000 * 60 * 5, // 5 minutes
})

export const coffeeQueryOptions = (slug: string) =>
	queryOptions({
		queryFn: () => api.coffees.getCoffee(slug),
		queryKey: ['coffees', slug],
		staleTime: 1000 * 60 * 5, // 5 minutes
	})
