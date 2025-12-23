import { Hono } from 'hono'

import type { SupportedLocale } from '~common/locales'
import { defaultJsonHeaders } from '~workers/utils/headers'
import { api } from '~workers/utils/poster'
import sanity from '~workers/utils/sanity'
import webflow from '~workers/utils/webflow'

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
			sanity.listProducts(context.env).catch(() => null),
		])

		// eslint-disable-next-line no-console
		console.log(sanityProducts)

		const body = posterProducts.map((product) => {
			const sanityProduct = sanityProducts?.find(
				(sanityProduct) => sanityProduct.posterId === product.product_id,
			)

			const name = sanityProduct?.name?.[language] ?? product.product_name

			return {
				...product,
				caffeine: sanityProduct?.caffeine,
				excerpt: sanityProduct?.excerpt?.[language],
				intensity: sanityProduct?.intensity,
				name,
				product_name: name,
				tag: sanityProduct?.tag,
			}
		})

		return context.json(body, 200, defaultJsonHeaders)
	})

	.get('/promotions', async (context) => {
		// const _language = context.get('language')

		const [posterPromotions, webflowPromotions, _sanityPromotions] =
			await Promise.all([
				api.clients.getPromotions(context.env.POSTER_TOKEN).catch(() => []),
				webflow.collections.listPromotions(context.env).catch(() => []),
				sanity.listPromotions(context.env).catch(() => []),
			])

		const webflowById = webflowPromotions?.reduce(
			(accumulator, item) => {
				const id = String(item['poster-id']) as
					| keyof typeof accumulator
					| undefined
				if (id) accumulator[id] = item
				return accumulator
			},
			{} as Record<string, (typeof webflowPromotions)[number]>,
		)

		const merged = posterPromotions.map((promotion) => {
			const webflowItem = webflowById?.[
				promotion.promotion_id as keyof typeof webflowById
			] as Record<string, unknown> | undefined
			if (!webflowItem) return promotion

			const image =
				typeof webflowItem.image === 'string'
					? { url: webflowItem.image }
					: (webflowItem.image as undefined | { url?: string })

			return {
				...promotion,
				description: webflowItem.description,
				image,
				name: webflowItem.name ?? promotion.name,
				slug: webflowItem.slug,
				summary: webflowItem.summary,
			}
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
			const collectionItemId = await context.env.KV_CMS.get(productId)

			const [posterProduct, webflowProduct, sanityProduct] = await Promise.all([
				api.menu.getProduct(context.env.POSTER_TOKEN, productId),
				collectionItemId
					? webflow.collections.getProduct(context.env, collectionItemId)
					: Promise.resolve(null),
				sanity.getProduct(context.env, productId).catch(() => null),
			])

			const name =
				sanityProduct?.name?.[language] ||
				webflowProduct?.name ||
				posterProduct.product_name

			const body = {
				...webflowProduct,
				...posterProduct,
				caffeine: sanityProduct?.caffeine,
				description: sanityProduct?.description?.[language],
				excerpt: sanityProduct?.excerpt?.[language],
				intensity: sanityProduct?.intensity,
				name,
				product_name: name,
				tag: sanityProduct?.tag,
			}

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
