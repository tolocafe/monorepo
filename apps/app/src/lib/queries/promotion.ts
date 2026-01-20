import { queryOptions } from '@tanstack/react-query'

import { queryClient } from '~/lib/query-client'
import { api } from '~/lib/services/api-service'

import { promotionsQueryOptions } from './menu'

export const promotionQueryOptions = (promotionId: string) =>
	queryOptions({
		enabled: Boolean(promotionId),
		placeholderData: () => {
			const promotion = queryClient
				.getQueryData(promotionsQueryOptions.queryKey)
				?.find((promotion) => promotion.promotion_id === promotionId)

			return promotion
		},
		queryFn: () => api.menu.getPromotion(promotionId),
		queryKey: ['menu', 'promotions', promotionId] as const,
	})
