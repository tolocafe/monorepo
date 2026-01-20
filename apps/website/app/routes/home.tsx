import { useOutletContext } from 'react-router'

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

	return [
		{ title: t.title },
		{ content: t.description, name: 'description' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': ['Organization', 'CafeOrRestaurant'],
				address: {
					'@type': 'PostalAddress',
					addressCountry: 'MX',
					addressLocality: 'Toluca',
					addressRegion: 'Estado de México',
					postalCode: '50130',
					streetAddress:
						'Blvr. José María Pino Suárez 800, Cuauhtémoc, 50130 Toluca de Lerdo, Méx.',
				},
				contactPoint: {
					'@type': 'ContactPoint',
					contactType: 'customer service',
					email: 'hola@tolo.cafe',
				},
				description: t.description,
				logo: 'https://tolo.cafe/favicon.png',
				mobileApplication: {
					'@type': 'MobileApplication',
					applicationCategory: 'LifestyleApplication',
					downloadUrl: [
						'https://apps.apple.com/app/tolo-buen-café/id6749597635',
						'https://play.google.com/store/apps/details?id=cafe.tolo.app',
					],
					name: 'TOLO - Buen Café',
					offers: {
						'@type': 'Offer',
						price: '0',
						priceCurrency: 'USD',
					},
					operatingSystem: 'iOS, Android',
				},
				name: 'TOLO Coffee',
				priceRange: '$$',
				sameAs: [
					'https://instagram.com/tolo.cafe',
					'https://facebook.com/tolo.cafe',
					'https://tiktok.com/@tolo.cafe',
				],
				servesCuisine: 'Coffee',
				url: 'https://tolo.cafe',
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
