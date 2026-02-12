import type { PortableTextBlock } from '@portabletext/types'
import type { SanityImageReference } from '@tolo/common/api'
import type { SupportedLocale } from '@tolo/common/locales'

import type { Bindings } from '@/types'

type SanityImage = {
	_key: string
	_type: 'image'
	alt?: LocaleText
	asset?: { _ref: string; _type: 'reference' }
}

type LocaleBlockContent = Partial<
	Record<SupportedLocale, PortableTextBlock[]>
> & {
	_type: 'localeBlockContent'
}

type LocaleSlug = Partial<
	Record<SupportedLocale, { _type: 'slug'; current: string }>
> & {
	_type: 'localeSlug'
}

type LocaleText = Partial<Record<SupportedLocale, string>> & {
	_type: 'localeString' | 'localeText'
}

/**
 * Localized Sanity bean (after language extraction in GROQ)
 */
type SanityLocalizedBean = {
	_createdAt: string
	_id: string
	agtron: number
	excerpt?: string
	name?: string
	origin?: string
	process?: string
	region?: string
	slug?: { current: string }
	tastingNotes?: string
	varietal?: string
}

/**
 * Localized Sanity blog post (after language extraction in GROQ)
 */
type SanityLocalizedBlogPost = {
	_createdAt: string
	_id: string
	body?: string
	excerpt?: string
	image?: SanityImage
	name?: string
	slug?: { current: string }
}

/**
 * Localized Sanity event (after language extraction in GROQ)
 * Note: For single getEvent, images are transformed to { sourceId: string }[]
 * For listEvents, images remain as SanityImage[]
 */
type SanityLocalizedEvent = {
	_createdAt: string
	_id: string
	body?: string
	endDate?: string
	excerpt?: string
	image?: SanityImage
	images?: SanityImage[] | { sourceId: string }[]
	isFeatured?: boolean
	location?: { _ref: string; _type: 'reference' }
	maxAttendees?: number
	name?: string
	registrationUrl?: string
	slug?: { current: string }
	startDate: string
	status: 'cancelled' | 'completed' | 'ongoing' | 'upcoming'
}

/**
 * Localized Sanity product (after language extraction in GROQ)
 * This is what GROQ queries return after extracting a specific language
 * NOT the same as the API Product type - fields are named differently in Sanity
 *
 * Sanity field names vs API names:
 * - body (Sanity) -> description (API)
 * - name (Sanity, localized) -> product_name (API)
 */
type SanityLocalizedProduct = {
	/** In Sanity: `body.{lang}`, maps to API `description` */
	body?: PortableTextBlock[]
	caffeine?: number
	calories?: number
	excerpt?: string
	images?: SanityImageReference[]
	intensity?: number
	/** In Sanity: `name.{lang}`, maps to API `product_name` */
	name?: string
	posterId: string
	/** In Sanity: `recipe.{lang}`, barista recipe instructions */
	recipe?: PortableTextBlock[]
	tag?: 'FAVORITE' | 'NEW' | 'SEASONAL' | 'SPECIAL'
	size?: number
	sizeUnit?: 'g' | 'ml'
}

/**
 * Localized Sanity promotion (used internally by workers)
 * After extracting language-specific values from multi-language fields
 * NOT the same as the API Promotion type - fields are named differently in Sanity
 *
 * Sanity field names vs API names:
 * - body (Sanity) -> description (API)
 * - name (Sanity, localized) -> name (API, but still needs localization)
 */
type SanityLocalizedPromotion = {
	_createdAt: string
	_id: string
	_type: 'promotion'
	/** In Sanity: `body.{lang}`, maps to API `description` */
	body?: PortableTextBlock[]
	excerpt?: string
	images?: SanityImageReference[]
	name?: string
	posterId?: string
	slug?: { current: string }
}

/**
 * Build a direct Sanity API image URL (bypasses CDN)
 * Format: https://PROJECT_ID.api.sanity.io/v2021-06-07/assets/images/DATASET/ASSET_ID.EXTENSION
 */
export function buildDirectImageUrl(
	projectId: string,
	dataset: string,
	assetId: string | undefined,
	extension: string | undefined,
) {
	if (!assetId || !extension) return null

	// Remove "image-" prefix if present
	const cleanAssetId = assetId.replace(/^image-/, '')

	return `https://${projectId}.api.sanity.io/v2021-06-07/assets/images/${dataset}/${cleanAssetId}.${extension}`
}

function fetchSanity<TResponse = unknown>(
	environment: Bindings,
	parameters: Record<string, string>,
) {
	const dataset = 'production'
	const apiVersion = 'v2025-02-19'
	const baseUrl = `https://${environment.SANITY_PROJECT_ID}.apicdn.sanity.io/${apiVersion}/data/query/${dataset}`

	return fetch(`${baseUrl}?${new URLSearchParams(parameters)}`)
		.then(
			(response) =>
				response.json() as Promise<{
					ms: number
					query: string
					result: TResponse
				}>,
		)
		.then((response) => response.result)
}

/**
 * Get localized block content from a LocaleBlockContent object
 * Falls back to English if the requested language is not available
 */
export function getLocalizedBlockContent(
	content: LocaleBlockContent | undefined,
	language: SupportedLocale,
) {
	if (!content) return null
	const value = content[language as keyof typeof content] as
		| PortableTextBlock[]
		| null
	return value ?? (content.en as PortableTextBlock[] | undefined)
}

/**
 * Get localized slug from a LocaleSlug object
 * Falls back to English if the requested language is not available
 */
export function getLocalizedSlug(
	slug: LocaleSlug | undefined,
	language: SupportedLocale,
) {
	if (!slug) return null
	const localeSlug = slug[language as keyof typeof slug] as null | {
		_type: 'slug'
		current: string
	}
	const enSlug = slug.en as null | { _type: 'slug'; current: string }
	return (localeSlug?.current || enSlug?.current) ?? null
}

/**
 * Get localized string from a LocaleText object
 * Falls back to English if the requested language is not available
 */
export function getLocalizedString(
	text: LocaleText | null | undefined,
	language: SupportedLocale,
) {
	if (!text) return null
	const value = text[language as keyof typeof text]
	return (value || text.en) ?? null
}

const sanity = {
	getBean(environment: Bindings, itemId: string, language: SupportedLocale) {
		return fetchSanity<SanityLocalizedBean>(environment, {
			query: `*[_type == "bean" && _id == "${itemId}"][0]{
				_id,
				_createdAt,
				agtron,
				"excerpt": excerpt.${language},
				"name": name.${language},
				"origin": origin.${language},
				"process": process.${language},
				"region": region.${language},
				"slug": slug.${language},
				"tastingNotes": tastingNotes.${language},
				"varietal": varietal.${language}
			}`,
		})
	},
	getBlogPost(
		environment: Bindings,
		itemId: string,
		language: SupportedLocale,
	) {
		return fetchSanity<null | SanityLocalizedBlogPost>(environment, {
			query: `*[_type == "post" && _id == "${itemId}"][0]{
				_id,
				_createdAt,
				"body": body.${language},
				"excerpt": excerpt.${language},
				image,
				"name": name.${language},
				"slug": slug.${language}
			}`,
		})
	},
	getEvent(environment: Bindings, itemId: string, language: SupportedLocale) {
		type EventQueryResult = Omit<SanityLocalizedEvent, 'images'> & {
			images?: string[]
		}

		return fetchSanity<null | EventQueryResult>(environment, {
			query: `*[_type == "event" && _id == "${itemId}"][0]{
				_id,
				_createdAt,
				"body": body.${language},
				endDate,
				"excerpt": excerpt.${language},
				image,
				"images": images[].asset->_id,
				isFeatured,
				location,
				maxAttendees,
				"name": name.${language},
				registrationUrl,
				"slug": slug.${language},
				startDate,
				status
			}`,
		}).then((event) => {
			if (!event) return null
			return {
				...event,
				images: event.images?.map((sourceId) => ({
					sourceId,
				})),
			}
		})
	},
	getProduct(environment: Bindings, itemId: string, language: SupportedLocale) {
		type ProductQueryResult = Omit<SanityLocalizedProduct, 'images'> & {
			images?: string[]
		}

		return fetchSanity<null | ProductQueryResult>(environment, {
			query: `*[_type == "product" && posterId == "${itemId}"][0]{
				"body": body.${language},
				caffeine,
				calories,
				"excerpt": excerpt.${language},
				"images": images[].asset->_id,
				intensity,
				"name": name.${language},
				posterId,
				"recipe": recipe.${language},
				tag,
				size,
				sizeUnit
			}`,
		}).then((product): null | SanityLocalizedProduct => {
			if (!product) return null
			return {
				...product,
				images: product.images?.map((sourceId) => ({ sourceId })),
			}
		})
	},
	getPromotion(
		environment: Bindings,
		itemId: string,
		language: SupportedLocale,
	) {
		type PromotionQueryResult = Omit<SanityLocalizedPromotion, 'images'> & {
			images?: string[]
		}

		return fetchSanity<null | PromotionQueryResult>(environment, {
			query: `*[_type == "promotion" && posterId == "${itemId}"][0]{
				_createdAt,
				_id,
				_type,
				"body": body.${language},
				"excerpt": excerpt.${language},
				"images": images[].asset->_id,
				"name": name.${language},
				posterId,
				"slug": slug.${language}
			}`,
		}).then((promotion): null | SanityLocalizedPromotion => {
			if (!promotion) return null
			return {
				...promotion,
				images: promotion.images?.map((sourceId) => ({ sourceId })),
			}
		})
	},
	listBeans(environment: Bindings, language: SupportedLocale) {
		return fetchSanity<SanityLocalizedBean[]>(environment, {
			query: `*[_type == "bean"]{
				_id,
				_createdAt,
				agtron,
				"excerpt": excerpt.${language},
				"name": name.${language},
				"origin": origin.${language},
				"process": process.${language},
				"region": region.${language},
				"slug": slug.${language},
				"tastingNotes": tastingNotes.${language},
				"varietal": varietal.${language}
			}`,
		})
	},
	listBlogPosts(environment: Bindings, language: SupportedLocale) {
		return fetchSanity<SanityLocalizedBlogPost[]>(environment, {
			query: `*[_type == "post"]{
				_id,
				_createdAt,
				"body": body.${language},
				"excerpt": excerpt.${language},
				image,
				"name": name.${language},
				"slug": slug.${language}
			} | order(_createdAt desc)`,
		})
	},
	listEvents(environment: Bindings, language: SupportedLocale) {
		return fetchSanity<SanityLocalizedEvent[]>(environment, {
			query: `*[_type == "event"]{
				_id,
				_createdAt,
				"body": body.${language},
				endDate,
				"excerpt": excerpt.${language},
				image,
				images,
				isFeatured,
				location,
				maxAttendees,
				"name": name.${language},
				registrationUrl,
				"slug": slug.${language},
				startDate,
				status
			}`,
		})
	},
	listProducts(environment: Bindings, language: SupportedLocale) {
		type ProductQueryResult = Omit<SanityLocalizedProduct, 'images'> & {
			images?: string[]
		}

		return fetchSanity<ProductQueryResult[]>(environment, {
			query: `*[_type == "product"]{
				"body": body.${language},
				caffeine,
				calories,
				"excerpt": excerpt.${language},
				"images": images[].asset->_id,
				intensity,
				"name": name.${language},
				posterId,
				"recipe": recipe.${language},
				tag,
				size,
				sizeUnit
			}`,
		}).then((products) =>
			products.map((product) => ({
				...product,
				images: product.images?.map((sourceId) => ({ sourceId })),
			})),
		)
	},
	listPromotions(environment: Bindings, language: SupportedLocale) {
		type PromotionQueryResult = Omit<SanityLocalizedPromotion, 'images'> & {
			images?: string[]
		}

		return fetchSanity<PromotionQueryResult[]>(environment, {
			query: `*[_type == "promotion"]{
				_createdAt,
				_id,
				_type,
				"body": body.${language},
				"excerpt": excerpt.${language},
				"images": images[].asset->_id,
				"name": name.${language},
				posterId,
				"slug": slug.${language}
			}`,
		}).then((promotions) =>
			promotions.map((promotion) => ({
				...promotion,
				images: promotion.images?.map((sourceId) => ({ sourceId })),
			})),
		)
	},
}

export default sanity
