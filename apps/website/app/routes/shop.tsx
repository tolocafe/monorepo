import { Trans } from '@lingui/react/macro'
import { Link, useOutletContext } from 'react-router'

import { ProductCard } from '@/components/ProductCard'
import type { Locale } from '@/lib/locale'
import { getProducts } from '@/lib/shop-data'
import type { MergedProduct } from '@/lib/shop-data'

import type { Route } from './+types/shop'
import * as styles from './shop.css'

const META_TRANSLATIONS = {
	de: {
		description: 'Entdecken Sie unsere Auswahl an Kaffee und Merchandise',
		heading: 'Shop',
		subtitle: 'Kaffee, Zubeh\u00f6r und mehr',
		title: 'Shop - TOLO',
	},
	en: {
		description: 'Explore our selection of coffee and merchandise',
		heading: 'Shop',
		subtitle: 'Coffee, accessories, and more',
		title: 'Shop - TOLO',
	},
	es: {
		description: 'Explora nuestra selecci\u00f3n de caf\u00e9 y mercanc\u00eda',
		heading: 'Tienda',
		subtitle: 'Caf\u00e9, accesorios y m\u00e1s',
		title: 'Tienda - TOLO',
	},
	fr: {
		description:
			'D\u00e9couvrez notre s\u00e9lection de caf\u00e9 et de marchandises',
		heading: 'Boutique',
		subtitle: 'Caf\u00e9, accessoires et plus',
		title: 'Boutique - TOLO',
	},
	ja: {
		description:
			'\u30b3\u30fc\u30d2\u30fc\u3068\u30b0\u30c3\u30ba\u306e\u30bb\u30ec\u30af\u30b7\u30e7\u30f3\u3092\u3054\u89a7\u304f\u3060\u3055\u3044',
		heading: '\u30b7\u30e7\u30c3\u30d7',
		subtitle:
			'\u30b3\u30fc\u30d2\u30fc\u3001\u30a2\u30af\u30bb\u30b5\u30ea\u30fc\u306a\u3069',
		title: '\u30b7\u30e7\u30c3\u30d7 - TOLO',
	},
} as const

export async function loader({ params }: Route.LoaderArgs) {
	const locale = (params.locale as Locale) || 'es'
	const products = await getProducts(locale)
	return { products }
}

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es

	return [
		{ title: t.title },
		{ content: t.description, name: 'description' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'CollectionPage',
				description: t.subtitle,
				name: t.heading,
				publisher: {
					'@type': 'Organization',
					name: 'TOLO Coffee',
				},
				url: `https://tolo.cafe/${locale}/shop`,
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
								to={`/${locale}/shop/${product.handle}`}
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
