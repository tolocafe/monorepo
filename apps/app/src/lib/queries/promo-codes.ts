import { mutationOptions, queryOptions } from '@tanstack/react-query'
import type { PromoCodePreview } from '@tolo/common/api'

import { api } from '@/lib/services/api-service'

export const createPromoCodeMutationOptions = mutationOptions({
	mutationFn: (data: { amount: number }) => api.promoCodes.create(data),
})

export const promoCodePreviewQueryOptions = (code: null | string) =>
	queryOptions<PromoCodePreview | null>({
		enabled: Boolean(code) && code!.replace(/-/g, '').length === 6,
		queryFn: () => api.promoCodes.preview(code!),
		queryKey: ['promo-code-preview', code],
		retry: false,
	})

export const redeemPromoCodeMutationOptions = mutationOptions({
	mutationFn: (code: string) => api.promoCodes.redeem(code),
})
