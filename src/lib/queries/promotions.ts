import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

export const promotionsQueryOptions = queryOptions({
	initialData: [] as const,
	queryFn: api.promotions.getPromotions,
	queryKey: ['promotions'] as const,
})


