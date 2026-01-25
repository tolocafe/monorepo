/**
 * Shopify Storefront API Client for Website
 *
 * Fetches data from the Workers API which proxies Shopify Storefront API.
 */

const API_BASE = 'https://workers.tolo.cafe/v1/store'

/** Shopify Money type */
export type ShopifyMoney = {
	amount: string
	currencyCode: string
}

/** Shopify Image type */
export type ShopifyImage = {
	altText: null | string
	height: number
	id: string
	url: string
	width: number
}

/** Shopify Product Variant */
export type ShopifyProductVariant = {
	availableForSale: boolean
	compareAtPrice: null | ShopifyMoney
	id: string
	price: ShopifyMoney
	selectedOptions: { name: string; value: string }[]
	sku: null | string
	title: string
}

/** Shopify Product */
export type ShopifyProduct = {
	availableForSale: boolean
	description: string
	descriptionHtml: string
	featuredImage: null | ShopifyImage
	handle: string
	id: string
	images: { edges: { node: ShopifyImage }[] }
	options: { name: string; values: string[] }[]
	priceRange: {
		maxVariantPrice: ShopifyMoney
		minVariantPrice: ShopifyMoney
	}
	productType: string
	tags: string[]
	title: string
	variants: { edges: { node: ShopifyProductVariant }[] }
	vendor: string
}

/** Shopify Collection */
export type ShopifyCollection = {
	description: string
	handle: string
	id: string
	image: null | ShopifyImage
	products?: { edges: { node: ShopifyProduct }[] }
	title: string
}

/** Shopify Cart Line Item */
export type ShopifyCartLine = {
	cost: {
		subtotalAmount: ShopifyMoney
		totalAmount: ShopifyMoney
	}
	id: string
	merchandise: {
		id: string
		image?: ShopifyImage
		product: {
			featuredImage?: null | ShopifyImage
			handle: string
			id: string
			title: string
		}
		title: string
	}
	quantity: number
}

/** Shopify Cart */
export type ShopifyCart = {
	checkoutUrl: string
	cost: {
		subtotalAmount: ShopifyMoney
		totalAmount: ShopifyMoney
		totalTaxAmount: null | ShopifyMoney
	}
	id: string
	lines: { edges: { node: ShopifyCartLine }[] }
	totalQuantity: number
}

async function apiFetch<T>(
	path: string,
	options?: RequestInit,
): Promise<T | null> {
	const response = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers,
		},
	})

	if (!response.ok) {
		if (response.status === 404) return null
		throw new Error(`API error: ${response.status}`)
	}

	return response.json()
}

export const shopifyApi = {
	cart: {
		addLines(
			cartId: string,
			lines: { merchandiseId: string; quantity: number }[],
		) {
			return apiFetch<ShopifyCart>(
				`/cart/${encodeURIComponent(cartId)}/lines`,
				{
					body: JSON.stringify({ lines }),
					method: 'POST',
				},
			)
		},

		create(lines?: { merchandiseId: string; quantity: number }[]) {
			return apiFetch<ShopifyCart>('/cart', {
				body: JSON.stringify({ lines }),
				method: 'POST',
			})
		},

		get(cartId: string) {
			return apiFetch<ShopifyCart>(`/cart/${encodeURIComponent(cartId)}`)
		},

		removeLines(cartId: string, lineIds: string[]) {
			return apiFetch<ShopifyCart>(
				`/cart/${encodeURIComponent(cartId)}/lines`,
				{
					body: JSON.stringify({ lineIds }),
					method: 'DELETE',
				},
			)
		},

		updateLines(cartId: string, lines: { id: string; quantity: number }[]) {
			return apiFetch<ShopifyCart>(
				`/cart/${encodeURIComponent(cartId)}/lines`,
				{
					body: JSON.stringify({ lines }),
					method: 'PATCH',
				},
			)
		},
	},

	collections: {
		getByHandle(handle: string, limit?: number) {
			const params = limit ? `?limit=${limit}` : ''
			return apiFetch<ShopifyCollection>(
				`/collections/${encodeURIComponent(handle)}${params}`,
			)
		},

		list(limit?: number) {
			const params = limit ? `?limit=${limit}` : ''
			return apiFetch<ShopifyCollection[]>(`/collections${params}`)
		},
	},

	products: {
		getByHandle(handle: string) {
			return apiFetch<ShopifyProduct>(`/products/${encodeURIComponent(handle)}`)
		},

		list(options?: {
			limit?: number
			query?: string
			sort?: 'BEST_SELLING' | 'CREATED_AT' | 'PRICE' | 'TITLE'
		}) {
			const params = new URLSearchParams()
			if (options?.limit) params.set('limit', String(options.limit))
			if (options?.query) params.set('q', options.query)
			if (options?.sort) params.set('sort', options.sort)
			const queryString = params.toString()
			return apiFetch<ShopifyProduct[]>(
				`/products${queryString ? `?${queryString}` : ''}`,
			)
		},

		recommendations(productId: string) {
			return apiFetch<ShopifyProduct[]>(
				`/products/${encodeURIComponent(productId)}/recommendations`,
			)
		},
	},
}
