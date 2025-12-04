import { Hono } from 'hono'
import { defaultJsonHeaders } from '../utils/headers'
import { api } from '../utils/poster'

import type { Promotion } from '@common/api'
import type { Bindings } from '../types'

/**
 * Promotions route
 * Fetches promotional items from Poster and maps them to banner-friendly payloads.
 * Strategy:
 * - Read Poster menu categories and find any with name/tag indicating promotions
 * - Fetch products and filter those belonging to promo categories
 * - Map to Promotion[] with image and product links
 */
const promotions = new Hono<{ Bindings: Bindings }>().get('/', async (context) => {
	try {
		const [categories, products] = await Promise.all([
			api.menu.getMenuCategories(context.env.POSTER_TOKEN),
			api.menu.getMenuProducts(context.env.POSTER_TOKEN, { type: 'products' }),
		])

		// Detect categories likely representing promotions
		const promoCategoryIds = new Set(
			categories
				.filter((category) => {
					const name = category.category_name?.toLowerCase() ?? ''
					const tag = category.category_tag?.toLowerCase() ?? ''
					return (
						tag === 'promo' ||
						tag === 'promotions' ||
						name.includes('promo') ||
						name.includes('promoción') ||
						name.includes('promocion') ||
						name.includes('promociones')
					)
				})
				.map((category) => category.category_id),
		)

		const promoProducts = products.filter((product) =>
			promoCategoryIds.has(product.menu_category_id),
		)

		const payload: Promotion[] = promoProducts
			// eslint-disable-next-line unicorn/no-array-reduce
			.reduce<Promotion[]>((list, product) => {
				const image = product.photo_origin || product.photo
				if (!image) return list

				list.push({
					id: product.product_id,
					image,
					productId: product.product_id,
					subtitle: product['small-description'],
					title: product.product_name,
				})
				return list
			}, [])

		return context.json(payload, 200, defaultJsonHeaders)
	} catch {
		return context.json({ error: 'Failed to fetch promotions' }, 500, defaultJsonHeaders)
	}
})

export default promotions


