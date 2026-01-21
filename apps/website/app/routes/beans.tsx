import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Link, useOutletContext } from 'react-router'

import type { Locale } from '@/lib/locale'
import {
	client,
	urlFor,
	getLocalizedString,
	getLocalizedSlug,
} from '@/lib/sanity'
import type { Bean } from '@/lib/sanity'

import type { Route } from './+types/beans'
import * as styles from './beans.css'

// Meta translations for SEO (used in meta function which runs before React context)
const META_TRANSLATIONS = {
	de: {
		description:
			'Entdecken Sie unsere sorgfältig ausgewählten Kaffeebohnen aus aller Welt',
		heading: 'Unsere Bohnen',
		subtitle: 'Sorgfältig ausgewählte Single Origins und Blends',
		title: 'Unsere Bohnen - TOLO',
	},
	en: {
		description:
			'Discover our carefully selected coffee beans from around the world',
		heading: 'Our Beans',
		subtitle: 'Carefully selected single origins and blends',
		title: 'Our Beans - TOLO',
	},
	es: {
		description:
			'Descubre nuestros granos de café cuidadosamente seleccionados de todo el mundo',
		heading: 'Nuestros Granos',
		subtitle: 'Orígenes únicos y mezclas cuidadosamente seleccionados',
		title: 'Nuestros Granos - TOLO',
	},
	fr: {
		description:
			'Découvrez nos grains de café soigneusement sélectionnés du monde entier',
		heading: 'Nos Grains',
		subtitle: 'Origines uniques et mélanges soigneusement sélectionnés',
		title: 'Nos Grains - TOLO',
	},
	ja: {
		description: '世界中から厳選されたコーヒー豆をご紹介します',
		heading: 'コーヒー豆',
		subtitle: '厳選されたシングルオリジンとブレンド',
		title: 'コーヒー豆 - TOLO',
	},
} as const

const BEANS_QUERY = `*[
  _type == "bean"
  && (defined(slug.es.current) || defined(slug.en.current))
]|order(name.es asc)[0...50]{
  _id, name, slug, origin, region, altitude, process, excerpt, regionImage
}`

export async function loader() {
	return { beans: await client.fetch<Bean[]>(BEANS_QUERY) }
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
				url: `https://tolo.cafe/${locale}/beans`,
			},
		},
	]
}

export default function Beans({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const { beans } = loaderData

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>
						<Trans>Our Beans</Trans>
					</h1>
					<p className={styles.subtitle}>
						<Trans>Carefully selected single origins and blends</Trans>
					</p>
				</header>

				<div className={styles.content}>
					{beans.length > 0 ? (
						<div className={styles.beansGrid}>
							{beans.map((bean) => {
								const slug = getLocalizedSlug(bean.slug, locale)
								if (!slug) return null

								const name = getLocalizedString(bean.name, locale, 'Untitled')
								const origin = getLocalizedString(bean.origin, locale)
								const region = getLocalizedString(bean.region, locale)
								const process = getLocalizedString(bean.process, locale)
								const excerpt = getLocalizedString(bean.excerpt, locale)
								const imageUrl = bean.regionImage
									? urlFor(bean.regionImage)?.width(400).height(300).url()
									: null

								const beansPath = locale === 'en' ? 'beans' : 'granos'

								return (
									<Link
										key={bean._id}
										to={`/${locale}/${beansPath}/${slug}`}
										className={styles.beanCard}
									>
										{imageUrl && (
											<div className={styles.beanImageWrapper}>
												<img
													src={imageUrl}
													alt={bean.regionImage?.alt || name}
													className={styles.beanImage}
												/>
											</div>
										)}
										<div className={styles.beanContent}>
											<h2 className={styles.beanName}>{name}</h2>
											{(origin || region) && (
												<p className={styles.beanOrigin}>
													{[origin, region].filter(Boolean).join(', ')}
												</p>
											)}
											{excerpt && (
												<p className={styles.beanExcerpt}>{excerpt}</p>
											)}
											<div className={styles.beanMeta}>
												{bean.altitude && (
													<span className={styles.beanDetail}>
														{t`Altitude`}: {bean.altitude}m
													</span>
												)}
												{process && (
													<span className={styles.beanDetail}>
														{t`Process`}: {process}
													</span>
												)}
											</div>
										</div>
									</Link>
								)
							})}
						</div>
					) : (
						<div className={styles.emptyState}>
							<h2 className={styles.emptyTitle}>
								<Trans>Coming Soon</Trans>
							</h2>
							<p className={styles.emptyMessage}>
								<Trans>
									We are preparing our bean catalog. Check back soon to discover
									our carefully selected coffees.
								</Trans>
							</p>
						</div>
					)}
				</div>
			</div>
		</main>
	)
}
