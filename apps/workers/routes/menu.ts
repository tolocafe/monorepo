import { Hono } from 'hono'

import { defaultJsonHeaders } from '~workers/utils/headers'
import { api } from '~workers/utils/poster'
import sanity from '~workers/utils/sanity'

import type { Product, Promotion } from '~common/api'
import type { SupportedLocale } from '~common/locales'
import type { Bindings } from '~workers/types'

const menu = new Hono<{ Bindings: Bindings }>()
	.get('/categories', async (context) => {
		const categories = await api.menu.getMenuCategories(
			context.env.POSTER_TOKEN,
		)

		return context.json(categories, 200, defaultJsonHeaders)
	})

	.get('/products', async (context) => {
		const language = context.get('language') as SupportedLocale

		const [posterProducts, sanityProducts] = await Promise.all([
			api.menu.getMenuProducts(context.env.POSTER_TOKEN, {
				type: 'products',
			}),
			sanity.listProducts(context.env, language).catch(() => null),
		])

		// eslint-disable-next-line no-console
		console.log(sanityProducts)

		const body = posterProducts.map((product) => {
			const sanityProduct = sanityProducts?.find(
				(sanityProduct) => sanityProduct.posterId === product.product_id,
			)

			const name = sanityProduct?.name ?? product.product_name
			// Use first Sanity image as photo, fallback to Poster photo
			const photo = sanityProduct?.images?.[0]?.sourceId ?? product.photo

			return {
				...product,
				// Map Sanity 'body' to API 'blockContent' and 'description'
				blockContent: sanityProduct?.body,
				caffeine: sanityProduct?.caffeine,
				description: sanityProduct?.body,
				excerpt: sanityProduct?.excerpt,
				images: sanityProduct?.images,
				intensity: sanityProduct?.intensity,
				name,
				photo,
				product_name: name,
				tag: sanityProduct?.tag,
			} satisfies Product
		})

		return context.json(body, 200, defaultJsonHeaders)
	})

	.get('/promotions', async (context) => {
		const language = context.get('language') as SupportedLocale

		const [posterPromotions, sanityPromotions] = await Promise.all([
			api.clients.getPromotions(context.env.POSTER_TOKEN).catch(() => []),
			sanity.listPromotions(context.env, language).catch(() => []),
		])

		const sanityById = sanityPromotions.reduce<
			Record<string, (typeof sanityPromotions)[number] | undefined>
		>((accumulator, item) => {
			const id = item.posterId
			if (id) accumulator[id] = item
			return accumulator
		}, {})

		const merged = posterPromotions.map((promotion) => {
			const sanityItem = sanityById[promotion.promotion_id]

			if (!sanityItem) return promotion

			return {
				...promotion,
				// Sanity fields are already localized from the query
				description: sanityItem.body
					? JSON.stringify(sanityItem.body)
					: undefined,
				excerpt: sanityItem.excerpt,
				images: sanityItem.images,
				name: sanityItem.name ?? promotion.name,
				slug: sanityItem.slug?.current,
			} satisfies Promotion
		})

		return context.json(merged, 200, defaultJsonHeaders)
	})

	.get('/products/:id', async (context) => {
		const language = context.get('language') as SupportedLocale

		const productId = context.req.param('id')

		if (!productId) {
			return context.json(
				{ error: 'Product ID is required' },
				400,
				defaultJsonHeaders,
			)
		}

		try {
			const [posterProduct, sanityProduct] = await Promise.all([
				api.menu.getProduct(context.env.POSTER_TOKEN, productId),
				sanity.getProduct(context.env, productId, language).catch(() => null),
			])

			const name = sanityProduct?.name || posterProduct.product_name
			// Use first Sanity image as photo, fallback to Poster photo
			const photo = sanityProduct?.images?.[0]?.sourceId ?? posterProduct.photo

			const body = {
				...posterProduct,
				// Map Sanity 'body' to API 'blockContent' and 'description'
				blockContent: sanityProduct?.body,
				caffeine: sanityProduct?.caffeine,
				description: sanityProduct?.body,
				excerpt: sanityProduct?.excerpt,
				images: sanityProduct?.images,
				intensity: sanityProduct?.intensity,
				name,
				photo,
				product_name: name,
				tag: sanityProduct?.tag,
			} satisfies Product

			return context.json(body, 200, defaultJsonHeaders)
		} catch {
			return context.json(
				{ error: 'Failed to fetch product details' },
				500,
				defaultJsonHeaders,
			)
		}
	})

export default menu
