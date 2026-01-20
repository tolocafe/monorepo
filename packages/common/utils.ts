import type { PosterModification, Product } from './api'

export function getProductBaseCost(product: Product) {
	const cost = Number(
		'modifications' in product
			? (product.modifications?.at(0)?.spots.at(0)?.price as string)
			: (Object.values(product.price ?? {}).at(0) as string),
	)

	return cost
}

export function getProductTotalCost({
	modifications,
	product,
	quantity = 1,
}: {
	modifications: Record<string, number>
	product: Product
	quantity?: number
}) {
	const productData = product

	const price = getProductBaseCost(productData)

	const modificationsPrice = Object.entries(modifications).reduce(
		(sum, [modificationId, modificationAmount]) => {
			const modificationGroup = productData.group_modifications?.reduce(
				(accumulator, { modifications = [] }) => [
					...accumulator,
					...modifications,
				],
				[] as PosterModification[],
			)

			const modification = modificationGroup?.find(
				(modification) =>
					modification.dish_modification_id === Number(modificationId),
			)

			return sum + (modification?.price ?? 0) * modificationAmount * 100
		},
		price,
	)

	return modificationsPrice * quantity
}
