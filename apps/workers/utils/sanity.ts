import type { PortableTextBlock } from '@portabletext/types'

import type { SanityImageReference } from '~common/api'
import type { SupportedLocale } from '~common/locales'
import type { Bindings } from '~workers/types'

type Bean = SanitySchema<
	'bean',
	{
		agtron: number
		excerpt: LocaleText
		name: LocaleText
		origin: LocaleText | undefined
		process: LocaleText | undefined
		region: LocaleText | undefined
		slug: LocaleSlug
		tastingNotes: LocaleText | undefined
		varietal: LocaleText | undefined
	}
>

type Event = SanitySchema<
	'event',
	{
		body?: LocaleBlockContent
		endDate?: string
		excerpt?: LocaleText
		images?: {
			_key: string
			_type: 'image'
			alt?: LocaleText
			asset?: { _ref: string; _type: 'reference' }
		}[]
		isFeatured?: boolean
		location?: { _ref: string; _type: 'reference' }
		maxAttendees?: number
		name: LocaleText
		registrationUrl?: string
		slug: LocaleSlug
		startDate: string
		status: 'cancelled' | 'completed' | 'ongoing' | 'upcoming'
	}
>

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
	excerpt?: string
	images?: SanityImageReference[]
	intensity?: number
	/** In Sanity: `name.{lang}`, maps to API `product_name` */
	name?: string
	posterId: string
	tag?: 'FAVORITE' | 'NEW' | 'SEASONAL' | 'SPECIAL'
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

type SanitySchema<
	TType = string,
	TFields = Record<string, unknown>,
> = TFields & {
	_createdAt: string
	_id: string
	_type: TType
}

/**
 * Build a direct Sanity API image URL (bypasses CDN)
 * Format: https://PROJECT_ID.api.sanity.io/v2021-06-07/assets/images/DATASET/ASSET_ID.EXTENSION
 */
function buildDirectImageUrl(
	projectId: string,
	dataset: string,
	assetId: string | undefined,
	extension: string | undefined,
): string | undefined {
	if (!assetId || !extension) return undefined

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
function getLocalizedBlockContent(
	content: LocaleBlockContent | undefined,
	language: SupportedLocale,
): PortableTextBlock[] | undefined {
	if (!content) return undefined
	const value = content[language as keyof typeof content] as
		| PortableTextBlock[]
		| undefined
	return value ?? (content.en as PortableTextBlock[] | undefined)
}

/**
 * Get localized slug from a LocaleSlug object
 * Falls back to English if the requested language is not available
 */
function getLocalizedSlug(
	slug: LocaleSlug | undefined,
	language: SupportedLocale,
): string | undefined {
	if (!slug) return undefined
	const localeSlug = slug[language as keyof typeof slug] as
		| undefined
		| { _type: 'slug'; current: string }
	const enSlug = slug.en as undefined | { _type: 'slug'; current: string }
	return localeSlug?.current || enSlug?.current
}

/**
 * Get localized string from a LocaleText object
 * Falls back to English if the requested language is not available
 */
function getLocalizedString(
	text: LocaleText | undefined,
	language: SupportedLocale,
): string | undefined {
	if (!text) return undefined
	const value = text[language as keyof typeof text]
	return value || text.en
}

const sanity = {
	getBean(environment: Bindings, itemId: string) {
		return fetchSanity<Bean>(environment, {
			query: `*[_type == "bean" && _id == "${itemId}"][0]`,
		})
	},
	getEvent(environment: Bindings, itemId: string) {
		return fetchSanity<Event>(environment, {
			query: `*[_type == "event" && _id == "${itemId}"][0]`,
		})
	},
	getProduct(
		environment: Bindings,
		itemId: string,
		language: SupportedLocale,
	): Promise<null | SanityLocalizedProduct> {
		type ProductQueryResult = Omit<SanityLocalizedProduct, 'images'> & {
			images?: string[]
		}

		return fetchSanity<null | ProductQueryResult>(environment, {
			query: `*[_type == "product" && posterId == "${itemId}"][0]{
				"body": body.${language},
				caffeine,
				"excerpt": excerpt.${language},
				"images": images[].asset->_id,
				intensity,
				"name": name.${language},
				posterId,
				tag
			}`,
		}).then((product): null | SanityLocalizedProduct => {
			if (!product) return null
			return {
				...product,
				images: product.images?.map((sourceId) => ({ sourceId })),
			}
		})
	},
	listBeans(environment: Bindings) {
		return fetchSanity<Bean[]>(environment, {
			query: `*[_type == "bean"]`,
		})
	},
	listEvents(environment: Bindings) {
		return fetchSanity<Event[]>(environment, {
			query: `*[_type == "event"]`,
		})
	},
	listProducts(
		environment: Bindings,
		language: SupportedLocale,
	): Promise<SanityLocalizedProduct[]> {
		type ProductQueryResult = Omit<SanityLocalizedProduct, 'images'> & {
			images?: string[]
		}

		return fetchSanity<ProductQueryResult[]>(environment, {
			query: `*[_type == "product"]{
				"body": body.${language},
				caffeine,
				"excerpt": excerpt.${language},
				"images": images[].asset->_id,
				intensity,
				"name": name.${language},
				posterId,
				tag
			}`,
		}).then((products) =>
			products.map((product) => ({
				...product,
				images: product.images?.map((sourceId) => ({ sourceId })),
			})),
		)
	},
	listPromotions(
		environment: Bindings,
		language: SupportedLocale,
	): Promise<SanityLocalizedPromotion[]> {
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

export {
	buildDirectImageUrl,
	getLocalizedBlockContent,
	getLocalizedSlug,
	getLocalizedString,
}
export default sanity
