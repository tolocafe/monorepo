import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { productQueryOptions } from '@/lib/queries/product'
import type { Product } from '~common/api'

/**
 * Hook to fetch missing product details and provide a helper to get product names
 * @param productIds - Array of product IDs to fetch
 * @returns Helper function to get product name from cache
 */
export function useProductDetails(productIds: string[]) {
	const queryClient = useQueryClient()

	// Filter for missing products not in cache
	const missingProductIds = useMemo(
		() =>
			productIds.filter(
				(productId) =>
					!queryClient.getQueryData<Product>(
						productQueryOptions(productId).queryKey,
					),
			),
		[productIds, queryClient],
	)

	// Fetch missing products
	useQueries({
		queries: missingProductIds.map((productId) =>
			productQueryOptions(productId),
		),
	})

	// Helper function to get product name from cache
	const getProductName = (productId: string): string => {
		const productData = queryClient.getQueryData<Product>(
			productQueryOptions(productId).queryKey,
		)
		return productData?.product_name || `Product #${productId}`
	}

	return { getProductName }
}
