import { useOutletContext } from 'react-router'

import { BASE_URL, ORGANIZATION_ID } from '@/lib/constants'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { client } from '@/lib/sanity'
import type { Location, Post } from '@/lib/sanity'
import { getProducts } from '@/lib/shop-data'
import { Welcome } from '@/welcome/welcome'

import type { Route } from './+types/home'

interface LocaleContext {
	locale: Locale
}

const TRANSLATIONS = {
	de: {
		description:
			'TOLO ist eine Spezialitätenkaffeerösterei und Café: Espresso-Getränke, Pour Overs, Matcha, Cold Brew, Chai, Gebäck, Kakao und Tee. Wir rösten wöchentlich und verkaufen ganze Bohnen im Laden. Schnell, gemütlich, mit schnellem WLAN, hundefreundlich und mit Vorbestellung in unserer App.',
		title: 'TOLO | Spezialitätenkaffee | Guter Kaffee. Ganz einfach.',
	},
	en: {
		description:
			'TOLO is a specialty coffee roaster and café: espresso drinks, pour overs, matcha, cold brew, chai, pastries, cacao and tea. We roast weekly and sell whole bean coffee in-store. Fast service, high-speed Wi‑Fi, pet-friendly, and order ahead in our app.',
		title: 'TOLO | Specialty Coffee | Good Coffee, Simple as That',
	},
	es: {
		description:
			'TOLO es un tostador de café de especialidad y cafetería: espresso, pour overs, matcha, cold brew, chai, cacao, té y pan dulce. Tostamos café cada semana y vendemos café en grano (en tienda). Wi‑Fi rápido, pet‑friendly y pide por la app.',
		title: 'TOLO | Café de especialidad | Buen café, así de simple',
	},
	fr: {
		description:
			"TOLO est un torréfacteur de café de spécialité et café : espresso, pour overs, matcha, cold brew, chai, pâtisseries, cacao et thé. Torréfaction chaque semaine et café en grains en boutique. Service rapide, Wi\u2011Fi haut débit, animaux bienvenus et commande à l'avance via notre app.",
		title: 'TOLO | Café de spécialité | Du bon café, tout simplement',
	},
	ja: {
		description:
			'TOLOはスペシャルティコーヒーの焙煎所＆カフェ。エスプレッソ、プアオーバー、抹茶、コールドブリュー、チャイ、焼き菓子、カカオ、紅茶をご用意。毎週焙煎し、店頭でコーヒー豆も販売しています。高速Wi‑Fi、ペットOK、アプリで事前注文も。',
		title: 'TOLO｜スペシャルティコーヒー｜おいしいコーヒー。シンプルに。',
	},
} as const

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es
	const canonicalUrl = `${BASE_URL}/${locale}`
	const ogLocale = OG_LOCALES[locale] || 'es_MX'
	const alternateLocales = Object.entries(OG_LOCALES)
		.filter(([loc]) => loc !== locale)
		.map(([, ogLoc]) => ogLoc)

	return [
		{ href: canonicalUrl, rel: 'canonical', tagName: 'link' },
		{ title: t.title },
		{ content: t.description, name: 'description' },
		{ content: t.title, property: 'og:title' },
		{ content: 'website', property: 'og:type' },
		{ content: `${BASE_URL}/og-image.png`, property: 'og:image' },
		{ content: '1200', property: 'og:image:width' },
		{ content: '630', property: 'og:image:height' },
		{ content: 'TOLO - Good coffee, simple as that', property: 'og:image:alt' },
		{ content: canonicalUrl, property: 'og:url' },
		{ content: t.description, property: 'og:description' },
		{ content: 'TOLO', property: 'og:site_name' },
		{ content: ogLocale, property: 'og:locale' },
		...alternateLocales.map((loc) => ({
			content: loc,
			property: 'og:locale:alternate',
		})),
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@id': ORGANIZATION_ID,
				'@type': 'Organization',
				areaServed: {
					'@type': 'Country',
					name: 'Mexico',
				},
				contactPoint: {
					'@type': 'ContactPoint',
					availableLanguage: ['Spanish', 'English'],
					contactType: 'customer service',
					email: 'hola@tolo.cafe',
				},
				description: t.description,
				email: 'hola@tolo.cafe',
				foundingDate: '2024',
				legalName: 'TOLO - Buen Café',
				logo: {
					'@type': 'ImageObject',
					height: 512,
					url: `${BASE_URL}/favicon.png`,
					width: 512,
				},
				name: 'TOLO',
				sameAs: [
					'https://instagram.com/tolo.cafe',
					'https://facebook.com/tolo.cafe',
					'https://tiktok.com/@tolo.cafe',
					'https://www.tripadvisor.com/Restaurant_Review-g644384-d33287081-Reviews-TOLO_Buen_Cafe-Toluca_Central_Mexico_and_Gulf_Coast.html',
				],
				url: BASE_URL,
			},
		},
	]
}

const LOCATIONS_QUERY = `*[
  _type == "location"
  && (defined(slug.es.current) || defined(slug.en.current))
]|order(isMainLocation desc, name.es asc){
  _id, name, slug, address, city, country, hours, image, isMainLocation, isUpcoming
}`

const POSTS_QUERY = `*[
  _type == "post"
  && (defined(slug.es.current) || defined(slug.en.current))
]|order(publishedAt desc)[0...3]{
  _id, name, slug, publishedAt, excerpt, image
}`

export async function loader({ context, params }: Route.LoaderArgs) {
	const locale = (params.locale as Locale) || 'es'
	const [locations, posts, products] = await Promise.all([
		client.fetch<Location[]>(LOCATIONS_QUERY),
		client.fetch<Post[]>(POSTS_QUERY),
		getProducts(locale).then((all) => all.slice(0, 3)),
	])

	return {
		locations,
		message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE,
		posts,
		products,
	}
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<LocaleContext>()

	return (
		<Welcome
			locale={locale}
			locations={loaderData.locations}
			message={loaderData.message}
			posts={loaderData.posts}
			products={loaderData.products}
		/>
	)
}
