import { Hono } from 'hono'

import type { Product, Promotion } from '~common/api'
import type { SupportedLocale } from '~common/locales'
import type { Bindings } from '~workers/types'
import { defaultJsonHeaders } from '~workers/utils/headers'
import { api } from '~workers/utils/poster'
import sanity from '~workers/utils/sanity'

type Variables = {
	language: SupportedLocale
}

const menu = new Hono<{ Bindings: Bindings; Variables: Variables }>()
	.get('/categories', async (context) => {
		const categories = await api.menu.getMenuCategories(
			context.env.POSTER_TOKEN,
		)

		return context.json(categories, 200, defaultJsonHeaders)
	})

	.get('/products', async (context) => {
		const language = context.get('language')

		const [posterProducts, sanityProducts] = await Promise.all([
			api.menu.getMenuProducts(context.env.POSTER_TOKEN, {
				type: 'products',
			}),
			sanity.listProducts(context.env, language).catch(() => null),
		])

		const body = posterProducts
			.filter(
				(product) => product.hidden !== '1' || product.name.startsWith('_'),
			)
			.map((product) => {
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

		return context.json(body, 200, {
			...defaultJsonHeaders,
			'Content-Language': language,
		})
	})

	.get('/promotions', async (context) => {
		const language = context.get('language')

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

		return context.json(merged, 200, {
			...defaultJsonHeaders,
			'Content-Language': language,
		})
	})

	.get('/products/:id', async (context) => {
		const language = context.get('language')

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

			return context.json(body, 200, {
				...defaultJsonHeaders,
				'Content-Language': language,
			})
		} catch {
			return context.json(
				{ error: 'Failed to fetch product details' },
				500,
				defaultJsonHeaders,
			)
		}
	})

	.get('/promotions/:id', async (context) => {
		const language = context.get('language')

		const promotionId = context.req.param('id')

		if (!promotionId) {
			return context.json(
				{ error: 'Promotion ID is required' },
				400,
				defaultJsonHeaders,
			)
		}

		try {
			const [posterPromotions, sanityPromotion] = await Promise.all([
				api.clients.getPromotions(context.env.POSTER_TOKEN).catch(() => []),
				sanity
					.getPromotion(context.env, promotionId, language)
					.catch(() => null),
			])

			const posterPromotion = posterPromotions.find(
				(p) => String(p.promotion_id) === promotionId,
			)

			if (!posterPromotion) {
				return context.json(
					{ error: 'Promotion not found' },
					404,
					defaultJsonHeaders,
				)
			}

			const body = {
				...posterPromotion,
				// Sanity fields are already localized from the query
				description: sanityPromotion?.body
					? JSON.stringify(sanityPromotion.body)
					: undefined,
				excerpt: sanityPromotion?.excerpt,
				images: sanityPromotion?.images,
				name: sanityPromotion?.name ?? posterPromotion.name,
				slug: sanityPromotion?.slug?.current,
			} satisfies Promotion

			return context.json(body, 200, {
				...defaultJsonHeaders,
				'Content-Language': language,
			})
		} catch {
			return context.json(
				{ error: 'Failed to fetch promotion details' },
				500,
				defaultJsonHeaders,
			)
		}
	})

export default menu
