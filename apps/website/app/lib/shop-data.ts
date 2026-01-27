/**
 * Shop Data Module
 *
 * Fetches and merges product data from Sanity (localized content, images)
 * and Shopify (pricing, availability, variants)
 */

import type { TypedObject } from '@portabletext/types'

import type { Locale } from './locale'
import type {
	LocaleBlockContent,
	LocalizedSanityImage,
	StoreProduct,
} from './sanity'
import { client, urlFor, getLocalizedString, getLocalizedSlug } from './sanity'
import { shopifyApi } from './shopify'
import type { ShopifyProduct, ShopifyImage, ShopifyMoney } from './shopify'

/** Merged product with Sanity content + Shopify commerce data */
export type MergedProduct = {
	// Identifiers
	id: string
	handle: string
	slug?: string
	sanityId?: string

	// Localized content (from Sanity, with Shopify fallback)
	title: string
	description: string
	descriptionHtml: string
	excerpt?: string
	body?: TypedObject[]

	// Images (Sanity priority, Shopify fallback)
	images: ProductImage[]
	featuredImage: ProductImage | null

	// Commerce data (from Shopify)
	availableForSale: boolean
	priceRange: {
		maxVariantPrice: ShopifyMoney
		minVariantPrice: ShopifyMoney
	}
	variants: ShopifyProduct['variants']
	options: ShopifyProduct['options']

	// Metadata
	productType: string
	vendor: string
	tags: string[]
	category?: StoreProduct['category']
	badge?: StoreProduct['badge']
	sortOrder: number
}

export type ProductImage = {
	altText: null | string
	height?: number
	id: string
	url: string
	width?: number
}

const STORE_PRODUCTS_QUERY = `*[
	_type == "storeProduct"
	&& isVisible == true
] | order(sortOrder asc) {
	_id,
	shopifyHandle,
	slug,
	name,
	excerpt,
	body,
	images[] {
		asset,
		alt
	},
	category,
	badge,
	sortOrder
}`

const STORE_PRODUCT_BY_HANDLE_QUERY = `*[
	_type == "storeProduct"
	&& shopifyHandle == $handle
][0] {
	_id,
	shopifyHandle,
	slug,
	name,
	excerpt,
	body,
	images[] {
		asset,
		alt
	},
	category,
	badge,
	sortOrder
}`

const STORE_PRODUCT_BY_SLUG_QUERY = `*[
	_type == "storeProduct"
	&& (slug.es.current == $slug || slug.en.current == $slug || slug.de.current == $slug || slug.fr.current == $slug || slug.ja.current == $slug)
][0] {
	_id,
	shopifyHandle,
	slug,
	name,
	excerpt,
	body,
	images[] {
		asset,
		alt
	},
	category,
	badge,
	sortOrder
}`

/**
 * Convert Sanity images to ProductImage format
 */
function sanityImagesToProductImages(
	images: LocalizedSanityImage[] | undefined,
	locale: Locale,
): ProductImage[] {
	if (!images?.length) return []

	const result: ProductImage[] = []

	for (let index = 0; index < images.length; index += 1) {
		const img = images[index]
		const url = urlFor(img.asset)?.width(800).url()
		if (!url) continue

		result.push({
			altText: getLocalizedString(img.alt, locale) || null,
			id: `sanity-${index}`,
			url,
		})
	}

	return result
}

/**
 * Convert Shopify images to ProductImage format
 */
function shopifyImagesToProductImages(images: {
	edges: { node: ShopifyImage }[]
}): ProductImage[] {
	return images.edges.map(({ node }) => ({
		altText: node.altText,
		height: node.height,
		id: node.id,
		url: node.url,
		width: node.width,
	}))
}

/**
 * Merge a single Sanity product with its Shopify counterpart
 */
function mergeProduct(
	shopifyProduct: ShopifyProduct,
	sanityProduct: StoreProduct | null,
	locale: Locale,
): MergedProduct {
	const sanityImages = sanityImagesToProductImages(
		sanityProduct?.images,
		locale,
	)
	const shopifyImages = shopifyImagesToProductImages(shopifyProduct.images)

	// Use Sanity images if available, otherwise Shopify
	const images = sanityImages.length > 0 ? sanityImages : shopifyImages
	const featuredImage =
		images[0] ||
		(shopifyProduct.featuredImage
			? {
					altText: shopifyProduct.featuredImage.altText,
					height: shopifyProduct.featuredImage.height,
					id: shopifyProduct.featuredImage.id,
					url: shopifyProduct.featuredImage.url,
					width: shopifyProduct.featuredImage.width,
				}
			: null)

	// Get localized content from Sanity, fall back to Shopify
	const title = sanityProduct?.name
		? getLocalizedString(sanityProduct.name, locale, shopifyProduct.title)
		: shopifyProduct.title

	const excerpt = sanityProduct?.excerpt
		? getLocalizedString(sanityProduct.excerpt, locale)
		: undefined

	const body = sanityProduct?.body?.[locale] || sanityProduct?.body?.es

	// Get localized slug from Sanity, fall back to Shopify handle
	const slug = sanityProduct?.slug
		? getLocalizedSlug(sanityProduct.slug, locale) || shopifyProduct.handle
		: shopifyProduct.handle

	return {
		availableForSale: shopifyProduct.availableForSale,
		badge: sanityProduct?.badge,
		body,
		category: sanityProduct?.category,
		description: shopifyProduct.description,
		descriptionHtml: shopifyProduct.descriptionHtml,
		excerpt,
		featuredImage,
		handle: shopifyProduct.handle,
		id: shopifyProduct.id,
		images,
		options: shopifyProduct.options,
		priceRange: shopifyProduct.priceRange,
		productType: shopifyProduct.productType,
		sanityId: sanityProduct?._id,
		slug,
		sortOrder: sanityProduct?.sortOrder ?? 999,
		tags: shopifyProduct.tags,
		title,
		variants: shopifyProduct.variants,
		vendor: shopifyProduct.vendor,
	}
}

/**
 * Fetch all products with merged Sanity + Shopify data
 */
export async function getProducts(locale: Locale): Promise<MergedProduct[]> {
	// Fetch from both sources in parallel
	const [sanityProducts, shopifyProducts] = await Promise.all([
		client.fetch<StoreProduct[]>(STORE_PRODUCTS_QUERY),
		shopifyApi.products.list({ sort: 'BEST_SELLING' }),
	])

	if (!shopifyProducts) return []

	// Create a map of Sanity products by handle for quick lookup
	const sanityByHandle = new Map(
		sanityProducts.map((p) => [p.shopifyHandle, p]),
	)

	// Merge products - include all Shopify products, with Sanity data where available
	const merged = shopifyProducts.map((shopify) =>
		mergeProduct(shopify, sanityByHandle.get(shopify.handle) || null, locale),
	)

	// Sort by Sanity sortOrder (products with Sanity data first, then by Shopify order)
	return merged.toSorted((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Fetch a single product by handle with merged data
 */
export async function getProductByHandle(
	handle: string,
	locale: Locale,
): Promise<MergedProduct | null> {
	// Fetch from both sources in parallel
	const [sanityProduct, shopifyProduct] = await Promise.all([
		client.fetch<StoreProduct | null>(STORE_PRODUCT_BY_HANDLE_QUERY, {
			handle,
		}),
		shopifyApi.products.getByHandle(handle),
	])

	if (!shopifyProduct) return null

	return mergeProduct(shopifyProduct, sanityProduct, locale)
}

/**
 * Fetch a single product by localized slug with merged data
 * Falls back to handle lookup if no slug match found
 */
export async function getProductBySlug(
	slug: string,
	locale: Locale,
): Promise<MergedProduct | null> {
	// First try to find by localized slug
	const sanityProduct = await client.fetch<StoreProduct | null>(
		STORE_PRODUCT_BY_SLUG_QUERY,
		{ slug },
	)

	if (sanityProduct?.shopifyHandle) {
		const shopifyProduct = await shopifyApi.products.getByHandle(
			sanityProduct.shopifyHandle,
		)
		if (shopifyProduct) {
			return mergeProduct(shopifyProduct, sanityProduct, locale)
		}
	}

	// Fall back to handle lookup (for backwards compatibility)
	return getProductByHandle(slug, locale)
}

/**
 * Get localized body content
 */
export function getLocalizedBody(
	body: LocaleBlockContent | undefined,
	locale: Locale,
): TypedObject[] | undefined {
	return body?.[locale] || body?.es
}

/**
 * Get related products (up to 3 other products, excluding the current one)
 */
export async function getRelatedProducts(
	currentHandle: string,
	locale: Locale,
	limit = 3,
): Promise<MergedProduct[]> {
	const allProducts = await getProducts(locale)
	return allProducts.filter((p) => p.handle !== currentHandle).slice(0, limit)
}
