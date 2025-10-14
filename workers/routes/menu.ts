import { Hono } from 'hono'
import webflow from 'workers/utils/webflow'

import { defaultJsonHeaders } from '../utils/headers'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

const menu = new Hono<{ Bindings: Bindings }>()
	.get('/categories', async (context) => {
		const categories = await api.menu.getMenuCategories(
			context.env.POSTER_TOKEN,
		)

		return context.json(categories, 200, defaultJsonHeaders)
	})

	.get('/products', async (context) => {
		const products = await api.menu.getMenuProducts(context.env.POSTER_TOKEN, {
			type: 'products',
		})

		return context.json(products, 200, defaultJsonHeaders)
	})
	.get('/products/:id', async (context) => {
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

			const [collectionItem, product] = await Promise.all([
				collectionItemId
					? webflow.collections.getProduct(context.env, collectionItemId)
					: Promise.resolve(null),
				api.menu.getProduct(context.env.POSTER_TOKEN, productId),
			])

			return context.json(
				{ ...collectionItem, ...product },
				200,
				defaultJsonHeaders,
			)
		} catch {
			return context.json(
				{ error: 'Failed to fetch product details' },
				500,
				defaultJsonHeaders,
			)
		}
	})

export default menu
