/**
 * Shopify Storefront API Routes
 *
 * Handles e-commerce operations for retail products (coffee beans, tools, merchandise).
 * These routes proxy the Shopify Storefront API for the mobile app and website.
 */
import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import type { Bindings } from '@/types'
import { defaultJsonHeaders } from '@/utils/headers'
import { shopifyApi } from '@/utils/shopify'

const shopify = new Hono<{ Bindings: Bindings }>()
	/**
	 * List all products
	 * GET /shopify/products
	 */
	.get('/products', async (context) => {
		try {
			const sortKey = context.req.query('sort') as
				| 'BEST_SELLING'
				| 'CREATED_AT'
				| 'PRICE'
				| 'TITLE'
				| undefined
			const searchQuery = context.req.query('q')
			const first = context.req.query('limit')
				? Number.parseInt(context.req.query('limit')!, 10)
				: undefined

			const products = await shopifyApi.products.list(context.env, {
				first,
				query: searchQuery,
				sortKey,
			})

			return context.json(products, 200, defaultJsonHeaders)
		} catch (error) {
			captureException(error)
			throw new HTTPException(500, { message: 'Failed to fetch products' })
		}
	})

	/**
	 * Get a single product by handle
	 * GET /shopify/products/:handle
	 */
	.get('/products/:handle', async (context) => {
		const handle = context.req.param('handle')

		if (!handle) {
			throw new HTTPException(400, { message: 'Product handle is required' })
		}

		try {
			const product = await shopifyApi.products.getByHandle(context.env, handle)

			if (!product) {
				throw new HTTPException(404, { message: 'Product not found' })
			}

			return context.json(product, 200, defaultJsonHeaders)
		} catch (error) {
			if (error instanceof HTTPException) throw error
			captureException(error)
			throw new HTTPException(500, { message: 'Failed to fetch product' })
		}
	})

	/**
	 * Get product recommendations
	 * GET /shopify/products/:id/recommendations
	 */
	.get('/products/:id/recommendations', async (context) => {
		const productId = context.req.param('id')

		if (!productId) {
			throw new HTTPException(400, { message: 'Product ID is required' })
		}

		try {
			const recommendations = await shopifyApi.products.recommendations(
				context.env,
				productId,
			)

			return context.json(recommendations, 200, defaultJsonHeaders)
		} catch (error) {
			captureException(error)
			throw new HTTPException(500, {
				message: 'Failed to fetch recommendations',
			})
		}
	})

	/**
	 * List all collections
	 * GET /shopify/collections
	 */
	.get('/collections', async (context) => {
		try {
			const first = context.req.query('limit')
				? Number.parseInt(context.req.query('limit')!, 10)
				: undefined

			const collections = await shopifyApi.collections.list(context.env, first)

			return context.json(collections, 200, defaultJsonHeaders)
		} catch (error) {
			captureException(error)
			throw new HTTPException(500, { message: 'Failed to fetch collections' })
		}
	})

	/**
	 * Get a collection by handle with its products
	 * GET /shopify/collections/:handle
	 */
	.get('/collections/:handle', async (context) => {
		const handle = context.req.param('handle')

		if (!handle) {
			throw new HTTPException(400, { message: 'Collection handle is required' })
		}

		try {
			const productCount = context.req.query('limit')
				? Number.parseInt(context.req.query('limit')!, 10)
				: undefined

			const collection = await shopifyApi.collections.getByHandle(
				context.env,
				handle,
				productCount,
			)

			if (!collection) {
				throw new HTTPException(404, { message: 'Collection not found' })
			}

			return context.json(collection, 200, defaultJsonHeaders)
		} catch (error) {
			if (error instanceof HTTPException) throw error
			captureException(error)
			throw new HTTPException(500, { message: 'Failed to fetch collection' })
		}
	})

	/**
	 * Create a new cart
	 * POST /shopify/cart
	 * Body: { lines?: [{ merchandiseId: string, quantity: number }] }
	 */
	.post('/cart', async (context) => {
		try {
			const body = (await context.req.json()) as {
				lines?: { merchandiseId: string; quantity: number }[]
			}

			const cart = await shopifyApi.cart.create(context.env, body.lines)

			return context.json(cart, 201, defaultJsonHeaders)
		} catch (error) {
			captureException(error)
			throw new HTTPException(500, { message: 'Failed to create cart' })
		}
	})

	/**
	 * Get an existing cart
	 * GET /shopify/cart/:id
	 */
	.get('/cart/:id', async (context) => {
		const cartId = context.req.param('id')

		if (!cartId) {
			throw new HTTPException(400, { message: 'Cart ID is required' })
		}

		try {
			const cart = await shopifyApi.cart.get(context.env, cartId)

			if (!cart) {
				throw new HTTPException(404, { message: 'Cart not found' })
			}

			return context.json(cart, 200, defaultJsonHeaders)
		} catch (error) {
			if (error instanceof HTTPException) throw error
			captureException(error)
			throw new HTTPException(500, { message: 'Failed to fetch cart' })
		}
	})

	/**
	 * Add lines to a cart
	 * POST /shopify/cart/:id/lines
	 * Body: { lines: [{ merchandiseId: string, quantity: number }] }
	 */
	.post('/cart/:id/lines', async (context) => {
		const cartId = context.req.param('id')

		if (!cartId) {
			throw new HTTPException(400, { message: 'Cart ID is required' })
		}

		try {
			const body = (await context.req.json()) as {
				lines: { merchandiseId: string; quantity: number }[]
			}

			if (!body.lines?.length) {
				throw new HTTPException(400, { message: 'Lines are required' })
			}

			const cart = await shopifyApi.cart.addLines(
				context.env,
				cartId,
				body.lines,
			)

			return context.json(cart, 200, defaultJsonHeaders)
		} catch (error) {
			if (error instanceof HTTPException) throw error
			captureException(error)
			throw new HTTPException(500, { message: 'Failed to add lines to cart' })
		}
	})

	/**
	 * Update cart lines
	 * PATCH /shopify/cart/:id/lines
	 * Body: { lines: [{ id: string, quantity: number }] }
	 */
	.patch('/cart/:id/lines', async (context) => {
		const cartId = context.req.param('id')

		if (!cartId) {
			throw new HTTPException(400, { message: 'Cart ID is required' })
		}

		try {
			const body = (await context.req.json()) as {
				lines: { id: string; quantity: number }[]
			}

			if (!body.lines?.length) {
				throw new HTTPException(400, { message: 'Lines are required' })
			}

			const cart = await shopifyApi.cart.updateLines(
				context.env,
				cartId,
				body.lines,
			)

			return context.json(cart, 200, defaultJsonHeaders)
		} catch (error) {
			if (error instanceof HTTPException) throw error
			captureException(error)
			throw new HTTPException(500, { message: 'Failed to update cart lines' })
		}
	})

	/**
	 * Remove lines from a cart
	 * DELETE /shopify/cart/:id/lines
	 * Body: { lineIds: string[] }
	 */
	.delete('/cart/:id/lines', async (context) => {
		const cartId = context.req.param('id')

		if (!cartId) {
			throw new HTTPException(400, { message: 'Cart ID is required' })
		}

		try {
			const body = (await context.req.json()) as { lineIds: string[] }

			if (!body.lineIds?.length) {
				throw new HTTPException(400, { message: 'Line IDs are required' })
			}

			const cart = await shopifyApi.cart.removeLines(
				context.env,
				cartId,
				body.lineIds,
			)

			return context.json(cart, 200, defaultJsonHeaders)
		} catch (error) {
			if (error instanceof HTTPException) throw error
			captureException(error)
			throw new HTTPException(500, {
				message: 'Failed to remove lines from cart',
			})
		}
	})

export default shopify
