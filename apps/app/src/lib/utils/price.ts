import type { Product } from '@tolo/common/api'

import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'

const formatter = new Intl.NumberFormat('en-US', {
	currency: 'USD',
	maximumFractionDigits: 2,
	minimumFractionDigits: 0,
	style: 'currency',
})

/**
 * Formats Poster product prices which are returned as strings/numbers in cents.
 * Remove cents if they are 00.
 * Example: "250" (cents) -> "$2.50", "300" -> "$3"
 */
export function formatPrice(value: number | string): string {
	const cents = typeof value === 'string' ? Number.parseFloat(value) : value
	if (!Number.isFinite(cents)) return '$0'

	const dollars = cents / 100

	return formatter.format(dollars)
}

export function getProductBaseCost<TFormat extends false | true | undefined>(
	product: null | Product | undefined,
	format: TFormat = true as TFormat,
): TFormat extends false ? number : string {
	const cost = Number(
		typeof product === 'object' && product && 'modifications' in product
			? (product.modifications?.at(0)?.spots.at(0)?.price as string)
			: (Object.values(product?.price ?? {}).at(0) as string),
	)

	if (!format) {
		return cost as TFormat extends false ? number : string
	}

	return formatPrice(cost) as TFormat extends false ? number : string
}

export function getProductTotalCost({
	modifications,
	product,
	quantity,
}: {
	modifications: Record<string, number>
	product: Product | string | undefined
	quantity: number
}) {
	const productData =
		typeof product === 'string'
			? (queryClient.getQueryData<Product>(
					productQueryOptions(product).queryKey,
				) as Product)
			: product

	const price = getProductBaseCost(productData, false)

	const modificationsPrice = Object.entries(modifications).reduce(
		(sum, [modificationGroupId, modificationId]) => {
			const modificationGroup = productData?.group_modifications?.find(
				(modification) =>
					modification.dish_modification_group_id.toString() ===
					modificationGroupId,
			)

			const modification = modificationGroup?.modifications?.find(
				(modification) => modification.dish_modification_id === modificationId,
			)

			return sum + (modification?.price ?? 0) * 100
		},
		price,
	)

	return modificationsPrice * quantity
}
