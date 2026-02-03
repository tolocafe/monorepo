import { Trans } from '@lingui/react/macro'
import { Link, useOutletContext } from 'react-router'

import { ProductCard } from '@/components/ProductCard'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { getProducts } from '@/lib/shop-data'
import type { MergedProduct } from '@/lib/shop-data'

import type { Route } from './+types/shop'
import * as styles from './shop.css'

const META_TRANSLATIONS = {
	de: {
		description:
			'Entdecken Sie unsere Auswahl an Spezialitätenkaffee, Zubehör und exklusivem Merchandise. Frisch gerösteter Kaffee direkt zu Ihnen nach Hause.',
		heading: 'Shop',
		subtitle: 'Kaffee, Zubehör und mehr',
		title: 'Shop - TOLO',
	},
	en: {
		description:
			'Discover our selection of specialty coffee, brewing accessories, and exclusive merchandise. Freshly roasted coffee delivered to your door.',
		heading: 'Shop',
		subtitle: 'Coffee, accessories, and more',
		title: 'Shop - TOLO',
	},
	es: {
		description:
			'Descubre nuestra selección de café de especialidad, accesorios de preparación y mercancía exclusiva. Café recién tostado directo a tu puerta.',
		heading: 'Tienda',
		subtitle: 'Café, accesorios y más',
		title: 'Tienda - TOLO',
	},
	fr: {
		description:
			'Découvrez notre sélection de café de spécialité, accessoires et marchandises exclusives. Café fraîchement torréfié livré chez vous.',
		heading: 'Boutique',
		subtitle: 'Café, accessoires et plus',
		title: 'Boutique - TOLO',
	},
	ja: {
		description:
			'スペシャルティコーヒー、抽出器具、限定グッズのセレクションをご覧ください。焙煎したてのコーヒーをご自宅にお届けします。',
		heading: 'ショップ',
		subtitle: 'コーヒー、アクセサリーなど',
		title: 'ショップ - TOLO',
	},
} as const

const OG_IMAGE_URL = 'https://www.tolo.cafe/og-shop.png'

export async function loader({ params }: Route.LoaderArgs) {
	const locale = (params.locale as Locale) || 'es'
	const products = await getProducts(locale)
	return { products }
}

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es
	const baseUrl = 'https://www.tolo.cafe'
	const canonicalUrl = `${baseUrl}/${locale}/shop`
	const ogLocale = OG_LOCALES[locale] || 'es_MX'

	return [
		{ tagName: 'link', rel: 'canonical', href: canonicalUrl },
		{ title: t.title },
		{ content: t.description, name: 'description' },
		{ content: t.title, property: 'og:title' },
		{ content: 'website', property: 'og:type' },
		{ content: OG_IMAGE_URL, property: 'og:image' },
		{ content: canonicalUrl, property: 'og:url' },
		{ content: t.description, property: 'og:description' },
		{ content: 'TOLO', property: 'og:site_name' },
		{ content: ogLocale, property: 'og:locale' },
		{ content: 'summary_large_image', name: 'twitter:card' },
		{ content: t.title, name: 'twitter:title' },
		{ content: t.description, name: 'twitter:description' },
		{ content: OG_IMAGE_URL, name: 'twitter:image' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'CollectionPage',
				description: t.description,
				image: OG_IMAGE_URL,
				name: t.heading,
				publisher: {
					'@id': `${baseUrl}/#organization`,
					'@type': 'Organization',
					name: 'TOLO',
				},
				url: canonicalUrl,
			},
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						item: `${baseUrl}/${locale}`,
						name: 'TOLO',
						position: 1,
					},
					{
						'@type': 'ListItem',
						name: t.heading,
						position: 2,
					},
				],
			},
		},
	]
}

export default function Shop({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const { products } = loaderData

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>
						<Trans>Shop</Trans>
					</h1>
					<p className={styles.subtitle}>
						<Trans>Coffee, accessories, and more</Trans>
					</p>
				</header>

				{products.length > 0 ? (
					<div className={styles.productsGrid}>
						{products.map((product: MergedProduct) => (
							<Link
								key={product.id}
								to={`/${locale}/shop/${product.slug || product.handle}`}
								style={{ textDecoration: 'none' }}
							>
								<ProductCard product={product} />
							</Link>
						))}
					</div>
				) : (
					<div className={styles.emptyState}>
						<h2 className={styles.emptyTitle}>
							<Trans>Coming Soon</Trans>
						</h2>
						<p className={styles.emptyMessage}>
							<Trans>
								We are preparing our store. Check back soon to discover our
								products.
							</Trans>
						</p>
					</div>
				)}
			</div>
		</main>
	)
}
