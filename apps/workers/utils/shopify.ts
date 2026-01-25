/**
 * Shopify Storefront API Client
 *
 * This module provides a typed client for interacting with the Shopify Storefront API.
 * Used for customer-facing e-commerce functionality: browsing products, managing carts,
 * and initiating checkout for retail items (coffee beans, tools, merchandise).
 *
 * @see https://shopify.dev/docs/api/storefront - Storefront API Reference
 *
 * API Sections used:
 * - Products: Product catalog and variants
 * - Collections: Product groupings and categories
 * - Cart: Shopping cart management
 * - Checkout: Initiating checkout flow
 *
 * @module shopify
 */
import { getCurrentScope } from '@sentry/cloudflare'

import type { Bindings } from '@/types'

/** Storefront API version */
const API_VERSION = '2025-10'

/**
 * Custom error class for Shopify API errors
 */
class ShopifyError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ShopifyError'
	}
}

/** Shopify Money type */
type ShopifyMoney = {
	amount: string
	currencyCode: string
}

/** Shopify Image type */
type ShopifyImage = {
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
	products: { edges: { node: ShopifyProduct }[] }
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
		product: {
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

/** GraphQL response wrapper */
type GraphQLResponse<TData> = {
	data?: TData
	errors?: { message: string }[]
}

/**
 * Generic GraphQL fetch wrapper for Shopify Storefront API
 *
 * @template TData - Expected response data type
 * @param query - GraphQL query string
 * @param environment - Cloudflare Workers bindings
 * @param variables - Optional GraphQL variables
 * @returns Promise resolving to the response data
 * @throws {ShopifyError} When API returns an error
 */
async function shopifyFetch<TData>(
	query: string,
	environment: Bindings,
	variables?: Record<string, unknown>,
) {
	const currentScope = getCurrentScope()
	const endpoint = `https://${environment.SHOPIFY_STORE_DOMAIN}/api/${API_VERSION}/graphql.json`

	currentScope.setContext('Shopify Request', {
		endpoint,
		query: query.slice(0, 200),
		variables,
	})

	const response = await fetch(endpoint, {
		body: JSON.stringify({ query, variables }),
		headers: {
			'Content-Type': 'application/json',
			'X-Shopify-Storefront-Access-Token':
				environment.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
		},
		method: 'POST',
	})

	if (!response.ok) {
		console.error('Shopify HTTP Error:', response.status, response.statusText)
		throw new ShopifyError(`HTTP ${response.status}: ${response.statusText}`)
	}

	const data = (await response.json()) as GraphQLResponse<TData>

	currentScope.setContext('Shopify Response', {
		errors: data.errors,
		hasData: Boolean(data.data),
	})

	if (data.errors?.length) {
		console.error('Shopify API Error:', JSON.stringify(data.errors))
		throw new ShopifyError(data.errors[0].message)
	}

	if (!data.data) {
		throw new ShopifyError('No data returned from Shopify')
	}

	return data.data
}

/** GraphQL fragments for reusable field selections */
const fragments = {
	cart: `
		fragment CartFields on Cart {
			id
			checkoutUrl
			totalQuantity
			cost {
				subtotalAmount { amount currencyCode }
				totalAmount { amount currencyCode }
				totalTaxAmount { amount currencyCode }
			}
			lines(first: 100) {
				edges {
					node {
						id
						quantity
						cost {
							subtotalAmount { amount currencyCode }
							totalAmount { amount currencyCode }
						}
						merchandise {
							... on ProductVariant {
								id
								title
								product {
									id
									handle
									title
								}
							}
						}
					}
				}
			}
		}
	`,
	product: `
		fragment ProductFields on Product {
			id
			handle
			title
			description
			descriptionHtml
			productType
			vendor
			tags
			availableForSale
			featuredImage {
				id
				url
				altText
				width
				height
			}
			images(first: 10) {
				edges {
					node {
						id
						url
						altText
						width
						height
					}
				}
			}
			options {
				name
				values
			}
			priceRange {
				minVariantPrice { amount currencyCode }
				maxVariantPrice { amount currencyCode }
			}
			variants(first: 100) {
				edges {
					node {
						id
						title
						sku
						availableForSale
						selectedOptions { name value }
						price { amount currencyCode }
						compareAtPrice { amount currencyCode }
					}
				}
			}
		}
	`,
}

/**
 * Shopify Storefront API client organized by resource type
 */
export const shopifyApi = {
	/**
	 * Cart Management
	 *
	 * Methods for creating, updating, and retrieving shopping carts.
	 * Carts persist across sessions and can be converted to checkouts.
	 *
	 * @see https://shopify.dev/docs/api/storefront/latest/objects/Cart
	 */
	cart: {
		/**
		 * Add lines to an existing cart
		 */
		addLines(
			environment: Bindings,
			cartId: string,
			lines: { merchandiseId: string; quantity: number }[],
		) {
			const query = `
				mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
					cartLinesAdd(cartId: $cartId, lines: $lines) {
						cart { ...CartFields }
						userErrors { field message }
					}
				}
				${fragments.cart}
			`

			return shopifyFetch<{
				cartLinesAdd: {
					cart: ShopifyCart
					userErrors: { field: string[]; message: string }[]
				}
			}>(query, environment, { cartId, lines }).then((data) => {
				if (data.cartLinesAdd.userErrors.length) {
					throw new ShopifyError(data.cartLinesAdd.userErrors[0].message)
				}
				return data.cartLinesAdd.cart
			})
		},

		/**
		 * Create a new cart with optional initial lines
		 */
		create(
			environment: Bindings,
			lines?: { merchandiseId: string; quantity: number }[],
		) {
			const query = `
				mutation cartCreate($input: CartInput) {
					cartCreate(input: $input) {
						cart { ...CartFields }
						userErrors { field message }
					}
				}
				${fragments.cart}
			`

			const input = lines ? { lines } : undefined

			return shopifyFetch<{
				cartCreate: {
					cart: ShopifyCart
					userErrors: { field: string[]; message: string }[]
				}
			}>(query, environment, { input }).then((data) => {
				if (data.cartCreate.userErrors.length) {
					throw new ShopifyError(data.cartCreate.userErrors[0].message)
				}
				return data.cartCreate.cart
			})
		},

		/**
		 * Get an existing cart by ID
		 */
		get(environment: Bindings, cartId: string) {
			const query = `
				query getCart($cartId: ID!) {
					cart(id: $cartId) { ...CartFields }
				}
				${fragments.cart}
			`

			return shopifyFetch<{ cart: null | ShopifyCart }>(query, environment, {
				cartId,
			}).then((data) => data.cart)
		},

		/**
		 * Remove lines from a cart
		 */
		removeLines(environment: Bindings, cartId: string, lineIds: string[]) {
			const query = `
				mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
					cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
						cart { ...CartFields }
						userErrors { field message }
					}
				}
				${fragments.cart}
			`

			return shopifyFetch<{
				cartLinesRemove: {
					cart: ShopifyCart
					userErrors: { field: string[]; message: string }[]
				}
			}>(query, environment, { cartId, lineIds }).then((data) => {
				if (data.cartLinesRemove.userErrors.length) {
					throw new ShopifyError(data.cartLinesRemove.userErrors[0].message)
				}
				return data.cartLinesRemove.cart
			})
		},

		/**
		 * Update line quantities in a cart
		 */
		updateLines(
			environment: Bindings,
			cartId: string,
			lines: { id: string; quantity: number }[],
		) {
			const query = `
				mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
					cartLinesUpdate(cartId: $cartId, lines: $lines) {
						cart { ...CartFields }
						userErrors { field message }
					}
				}
				${fragments.cart}
			`

			return shopifyFetch<{
				cartLinesUpdate: {
					cart: ShopifyCart
					userErrors: { field: string[]; message: string }[]
				}
			}>(query, environment, { cartId, lines }).then((data) => {
				if (data.cartLinesUpdate.userErrors.length) {
					throw new ShopifyError(data.cartLinesUpdate.userErrors[0].message)
				}
				return data.cartLinesUpdate.cart
			})
		},
	},

	/**
	 * Collections
	 *
	 * Methods for retrieving product collections (categories).
	 *
	 * @see https://shopify.dev/docs/api/storefront/latest/objects/Collection
	 */
	collections: {
		/**
		 * Get a collection by handle with its products
		 */
		getByHandle(
			environment: Bindings,
			handle: string,
			productCount: number = 50,
		) {
			const query = `
				query getCollection($handle: String!, $productCount: Int!) {
					collection(handle: $handle) {
						id
						handle
						title
						description
						image {
							id
							url
							altText
							width
							height
						}
						products(first: $productCount) {
							edges {
								node { ...ProductFields }
							}
						}
					}
				}
				${fragments.product}
			`

			return shopifyFetch<{ collection: null | ShopifyCollection }>(
				query,
				environment,
				{ handle, productCount },
			).then((data) => data.collection)
		},

		/**
		 * List all collections
		 */
		list(environment: Bindings, first: number = 50) {
			const query = `
				query listCollections($first: Int!) {
					collections(first: $first) {
						edges {
							node {
								id
								handle
								title
								description
								image {
									id
									url
									altText
									width
									height
								}
							}
						}
					}
				}
			`

			type CollectionNode = Omit<ShopifyCollection, 'products'>

			return shopifyFetch<{
				collections: { edges: { node: CollectionNode }[] }
			}>(query, environment, { first }).then((data) =>
				data.collections.edges.map((edge) => edge.node),
			)
		},
	},

	/**
	 * Products
	 *
	 * Methods for retrieving product information.
	 *
	 * @see https://shopify.dev/docs/api/storefront/latest/objects/Product
	 */
	products: {
		/**
		 * Get a product by handle
		 */
		getByHandle(environment: Bindings, handle: string) {
			const query = `
				query getProduct($handle: String!) {
					product(handle: $handle) { ...ProductFields }
				}
				${fragments.product}
			`

			return shopifyFetch<{ product: null | ShopifyProduct }>(
				query,
				environment,
				{ handle },
			).then((data) => data.product)
		},

		/**
		 * Get a product by ID
		 */
		getById(environment: Bindings, id: string) {
			const query = `
				query getProductById($id: ID!) {
					product(id: $id) { ...ProductFields }
				}
				${fragments.product}
			`

			return shopifyFetch<{ product: null | ShopifyProduct }>(
				query,
				environment,
				{ id },
			).then((data) => data.product)
		},

		/**
		 * List products with optional filters
		 */
		list(
			environment: Bindings,
			options: {
				first?: number
				query?: string
				sortKey?: 'BEST_SELLING' | 'CREATED_AT' | 'PRICE' | 'TITLE'
			} = {},
		) {
			const {
				first = 50,
				query: searchQuery,
				sortKey = 'BEST_SELLING',
			} = options

			const query = `
				query listProducts($first: Int!, $sortKey: ProductSortKeys, $query: String) {
					products(first: $first, sortKey: $sortKey, query: $query) {
						edges {
							node { ...ProductFields }
						}
					}
				}
				${fragments.product}
			`

			return shopifyFetch<{ products: { edges: { node: ShopifyProduct }[] } }>(
				query,
				environment,
				{ first, query: searchQuery, sortKey },
			).then((data) => data.products.edges.map((edge) => edge.node))
		},

		/**
		 * Get product recommendations
		 */
		recommendations(environment: Bindings, productId: string) {
			const query = `
				query getRecommendations($productId: ID!) {
					productRecommendations(productId: $productId) {
						...ProductFields
					}
				}
				${fragments.product}
			`

			return shopifyFetch<{ productRecommendations: ShopifyProduct[] }>(
				query,
				environment,
				{ productId },
			).then((data) => data.productRecommendations ?? [])
		},
	},
}
