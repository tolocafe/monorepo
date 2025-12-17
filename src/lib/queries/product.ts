import { queryOptions } from '@tanstack/react-query'

import { queryClient } from '@/lib/query-client'
import { api } from '@/lib/services/api-service'

import { productsQueryOptions } from './menu'

export const productQueryOptions = (productId: string) =>
	queryOptions({
		enabled: Boolean(productId),
		initialData: () => {
			const product = queryClient
				.getQueryData(productsQueryOptions.queryKey)
				?.find((product) => product.product_id === productId)

			return product
		},
		queryFn: () => api.menu.getProduct(productId),
		queryKey: ['product', productId] as const,
	})
