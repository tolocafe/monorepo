import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

export const categoriesQueryOptions = queryOptions({
	initialData: [],
	queryFn: api.menu.getCategories,
	queryKey: ['categories'] as const,
})

export const productsQueryOptions = queryOptions({
	initialData: [],
	queryFn: api.menu.getProducts,
	queryKey: ['products'] as const,
})

export const promotionsQueryOptions = queryOptions({
	initialData: [],
	queryFn: api.menu.getPromotions,
	queryKey: ['promotions'] as const,
})
