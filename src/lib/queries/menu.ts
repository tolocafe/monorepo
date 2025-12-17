import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

export const categoriesQueryOptions = queryOptions({
	placeholderData: [],
	queryFn: api.menu.getCategories,
	queryKey: ['categories'] as const,
})

export const productsQueryOptions = queryOptions({
	placeholderData: [],
	queryFn: api.menu.getProducts,
	queryKey: ['products'] as const,
})

export const promotionsQueryOptions = queryOptions({
	placeholderData: [],
	queryFn: api.menu.getPromotions,
	queryKey: ['promotions'] as const,
})
