import type {
	ClientData,
	PosterModificationGroup,
	Product as PosterProduct,
} from '@tolo/common/api'

import type { customers, productModifierGroups, products } from '@/db/schema'

import { toCents } from './utils'

/**
 * Map Poster client data to database customer format
 */
export function mapClient(client: ClientData | null, id: number) {
	return {
		birthday: client?.birthday ?? null,
		bonus: client?.bonus ? Number(client.bonus) : null,
		city: client?.city ?? null,
		clientGroupId: client?.client_groups_id
			? Number(client.client_groups_id)
			: null,
		clientGroupName: client?.client_groups_name ?? null,
		comment: client?.comment ?? null,
		country: client?.country ?? null,
		createdAt: client?.date_activale ?? null,
		email: client?.email ?? null,
		ewallet: client?.ewallet ? toCents(client.ewallet) : null,
		firstName: client?.firstname ?? null,
		id,
		lastName: client?.lastname ?? null,
		loyaltyType: client?.loyalty_type ?? null,
		patronymic: client?.patronymic ?? null,
		phone: client?.phone ?? client?.phone_number ?? null,
		totalPayedSum: client?.total_payed_sum
			? toCents(client.total_payed_sum)
			: null,
		updatedAt: new Date().toISOString(),
	} satisfies typeof customers.$inferInsert
}

/**
 * Map Poster modifier group to database format
 */
export function mapModifierGroup(
	group: PosterModificationGroup,
	productId: string,
): typeof productModifierGroups.$inferInsert {
	return {
		id: group.dish_modification_group_id,
		isDeleted: group.is_deleted === 1,
		name: group.name,
		numMax: group.num_max,
		numMin: group.num_min,
		productId: Number(productId),
		type: group.type,
	} satisfies typeof productModifierGroups.$inferInsert
}

/**
 * Map Poster product to database format
 */
export function mapProduct(product: PosterProduct) {
	const primaryPrice =
		typeof product.price === 'object'
			? Object.values(product.price)[0]
			: product.spots[0]?.price || undefined

	return {
		barcode: product.barcode || null,
		caffeine: product.caffeine || null,
		code: product.product_code || null,
		color: product.color || null,
		description:
			typeof product.description === 'string'
				? product.description
				: (product['small-description'] ?? null),
		differentSpotRaw: product.different_spots_prices || null,
		hidden: product.hidden === '1',
		id: Number(product.product_id),
		intensity: product.intensity || null,
		masterId: product.master_id ? Number(product.master_id) : null,
		menuCategoryId: product.menu_category_id
			? Number(product.menu_category_id)
			: null,
		name: product.product_name,
		noDiscount: product.nodiscount === '1',
		outOfStock: product.out || null,
		photo: product.photo || null,
		photoOrigin: product.photo_origin || null,
		priceCents: primaryPrice ? toCents(primaryPrice) : null,
		productionNote: product.product_production_description || null,
		profitRaw: JSON.stringify(product.profit),
		recipe: (product.recipe as unknown as string) || null,
		smallDescription: product['small-description'] || null,
		sourcesRaw: JSON.stringify(product.sources),
		spotsRaw: JSON.stringify(product.spots),
		taxId: product.tax_id ? Number(product.tax_id) : null,
		type: product.type ? Number(product.type) : null,
		unit: product.unit || null,
		volume: product.volume || null,
		weightFlag: product.weight_flag === '1',
		workshop: product.workshop || null,
	} satisfies typeof products.$inferInsert
}
