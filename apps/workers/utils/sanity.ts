import type { Bindings } from '~workers/types'

type Bean = SanitySchema<
	'bean',
	{
		agtron: number
		excerpt: LocaleText
		name: LocaleText
		slug: LocaleText
	}
>

type Event = SanitySchema<
	'event',
	{
		name: LocaleText
		slug: LocaleText
	}
>

type LocaleText = {
	_type: 'localeString'
	en: string
	es: string
}

type Product = SanitySchema<
	'product',
	{
		caffeine: number
		description: LocaleText | undefined
		excerpt: LocaleText | undefined
		intensity: number
		name: LocaleText | undefined
		posterId: string
		slug: LocaleText
		tag: LocaleText | undefined
	}
>

type Promotion = SanitySchema<
	'promotion',
	{
		name: LocaleText
		slug: LocaleText
	}
>

type SanitySchema<
	TType = string,
	TFields = Record<string, unknown>,
> = TFields & {
	_createdAt: string
	_id: string
	_type: TType
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
	getProduct(environment: Bindings, itemId: string) {
		return fetchSanity<Product>(environment, {
			query: `*[_type == "product" && posterId == "${itemId}"][0]`,
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
	listProducts(environment: Bindings) {
		return fetchSanity<Product[]>(environment, {
			query: `*[_type == "product"]`,
		})
	},
	listPromotions(environment: Bindings) {
		return fetchSanity<Promotion[]>(environment, {
			query: `*[_type == "promotion"]`,
		})
	},
}

export default sanity
