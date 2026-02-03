import { useOutletContext } from 'react-router'

import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { Welcome } from '@/welcome/welcome'

import type { Route } from './+types/home'

interface LocaleContext {
	locale: Locale
}

const TRANSLATIONS = {
	de: {
		description:
			'TOLO ist ein Spezialitätencafé in Toluca: Espresso-Getränke, Pour Overs, Matcha, Cold Brew, Chai, Gebäck, Kakao und Tee. Wir rösten wöchentlich und verkaufen ganze Bohnen im Laden. Schnell, gemütlich, mit schnellem WLAN, hundefreundlich und mit Vorbestellung in unserer App.',
		title: 'TOLO | Spezialitätenkaffee in Toluca | Guter Kaffee. Ganz einfach.',
	},
	en: {
		description:
			'TOLO is a specialty coffee shop in Toluca: espresso drinks, pour overs, matcha, cold brew, chai, pastries, cacao and tea. We roast weekly and sell whole bean coffee in-store. Fast service, high-speed Wi‑Fi, pet-friendly, and order ahead in our app.',
		title: 'TOLO | Specialty Coffee in Toluca | Good Coffee, Simple as That',
	},
	es: {
		description:
			'TOLO es un café de especialidad en Toluca: espresso, pour overs, matcha, cold brew, chai, cacao, té y pan dulce. Tostamos café cada semana y vendemos café en grano (en tienda). Wi‑Fi rápido, pet‑friendly y pide por la app.',
		title: 'TOLO | Café en Toluca | Buen café, así de simple',
	},
	fr: {
		description:
			'TOLO est un café de spécialité à Toluca : espresso, pour overs, matcha, cold brew, chai, pâtisseries, cacao et thé. Torréfaction chaque semaine et café en grains en boutique. Service rapide, Wi‑Fi haut débit, animaux bienvenus et commande à l’avance via notre app.',
		title: 'TOLO | Café de spécialité à Toluca | Du bon café, tout simplement',
	},
	ja: {
		description:
			'TOLOはトルーカのスペシャルティコーヒーショップ。エスプレッソ、プアオーバー、抹茶、コールドブリュー、チャイ、焼き菓子、カカオ、紅茶をご用意。毎週焙煎し、店頭でコーヒー豆も販売しています。高速Wi‑Fi、ペットOK、アプリで事前注文も。',
		title:
			'TOLO｜トルーカのスペシャルティコーヒー｜おいしいコーヒー。シンプルに。',
	},
} as const

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es
	const baseUrl = 'https://www.tolo.cafe'
	const canonicalUrl = `${baseUrl}/${locale}`
	const ogLocale = OG_LOCALES[locale] || 'es_MX'
	const alternateLocales = Object.entries(OG_LOCALES)
		.filter(([loc]) => loc !== locale)
		.map(([, ogLoc]) => ogLoc)

	return [
		{ tagName: 'link', rel: 'canonical', href: canonicalUrl },
		{ title: t.title },
		{ content: t.description, name: 'description' },
		{ content: t.title, property: 'og:title' },
		{ content: 'website', property: 'og:type' },
		{ content: `${baseUrl}/og-image.png`, property: 'og:image' },
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
				'@id': 'https://www.tolo.cafe/#organization',
				'@type': 'Organization',
				areaServed: {
					'@type': 'City',
					containedInPlace: {
						'@type': 'AdministrativeArea',
						name: 'Estado de México',
					},
					name: 'Toluca',
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
					url: 'https://www.tolo.cafe/favicon.png',
					width: 512,
				},
				name: 'TOLO',
				sameAs: [
					'https://instagram.com/tolo.cafe',
					'https://facebook.com/tolo.cafe',
					'https://tiktok.com/@tolo.cafe',
					'https://www.tripadvisor.com/Restaurant_Review-g644384-d33287081-Reviews-TOLO_Buen_Cafe-Toluca_Central_Mexico_and_Gulf_Coast.html',
				],
				url: 'https://www.tolo.cafe',
			},
		},
	]
}

export function loader({ context }: Route.LoaderArgs) {
	return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE }
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<LocaleContext>()

	return <Welcome message={loaderData.message} locale={locale} />
}
