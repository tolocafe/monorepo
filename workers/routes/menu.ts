import { Hono } from 'hono'

import { defaultJsonHeaders } from '../utils/headers'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

async function getCollectionItem(environment: Bindings, itemId: string) {
	const collectionId = environment.WEBFLOW_MENU_COLLECTION_ID

	const data = await fetch(
		`https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}/live`,
		{ headers: { Authorization: `Bearer ${environment.WEBFLOW_API_TOKEN}` } },
	).then(
		(response) =>
			response.json() as Promise<{ fieldData: Record<string, string> }>,
	)

	return data.fieldData
}

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
					? getCollectionItem(context.env, collectionItemId)
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
