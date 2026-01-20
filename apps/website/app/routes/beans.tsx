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

const TRANSLATIONS = {
	de: {
		altitudeLabel: 'Höhe',
		description:
			'Entdecken Sie unsere sorgfältig ausgewählten Kaffeebohnen aus aller Welt',
		emptyMessage:
			'Wir bereiten unseren Bohnenkatalog vor. Schauen Sie bald wieder vorbei, um unsere sorgfältig ausgewählten Kaffees zu entdecken.',
		emptyTitle: 'Demnächst',
		heading: 'Unsere Bohnen',
		processLabel: 'Verarbeitung',
		subtitle: 'Sorgfältig ausgewählte Single Origins und Blends',
		title: 'Unsere Bohnen - TOLO',
	},
	en: {
		altitudeLabel: 'Altitude',
		description:
			'Discover our carefully selected coffee beans from around the world',
		emptyMessage:
			'We are preparing our bean catalog. Check back soon to discover our carefully selected coffees.',
		emptyTitle: 'Coming Soon',
		heading: 'Our Beans',
		processLabel: 'Process',
		subtitle: 'Carefully selected single origins and blends',
		title: 'Our Beans - TOLO',
	},
	es: {
		altitudeLabel: 'Altitud',
		description:
			'Descubre nuestros granos de café cuidadosamente seleccionados de todo el mundo',
		emptyMessage:
			'Estamos preparando nuestro catálogo de granos. Vuelve pronto para descubrir nuestros cafés cuidadosamente seleccionados.',
		emptyTitle: 'Próximamente',
		heading: 'Nuestros Granos',
		processLabel: 'Proceso',
		subtitle: 'Orígenes únicos y mezclas cuidadosamente seleccionados',
		title: 'Nuestros Granos - TOLO',
	},
	fr: {
		altitudeLabel: 'Altitude',
		description:
			'Découvrez nos grains de café soigneusement sélectionnés du monde entier',
		emptyMessage:
			'Nous préparons notre catalogue de grains. Revenez bientôt pour découvrir nos cafés soigneusement sélectionnés.',
		emptyTitle: 'Bientôt Disponible',
		heading: 'Nos Grains',
		processLabel: 'Procédé',
		subtitle: 'Origines uniques et mélanges soigneusement sélectionnés',
		title: 'Nos Grains - TOLO',
	},
	ja: {
		altitudeLabel: '標高',
		description: '世界中から厳選されたコーヒー豆をご紹介します',
		emptyMessage:
			'コーヒー豆カタログを準備中です。厳選されたコーヒーをお届けするため、もうしばらくお待ちください。',
		emptyTitle: '近日公開',
		heading: 'コーヒー豆',
		processLabel: '精製方法',
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
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es

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
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es
	const { beans } = loaderData

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>{t.heading}</h1>
					<p className={styles.subtitle}>{t.subtitle}</p>
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
														{t.altitudeLabel}: {bean.altitude}m
													</span>
												)}
												{process && (
													<span className={styles.beanDetail}>
														{t.processLabel}: {process}
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
							<h2 className={styles.emptyTitle}>{t.emptyTitle}</h2>
							<p className={styles.emptyMessage}>{t.emptyMessage}</p>
						</div>
					)}
				</div>
			</div>
		</main>
	)
}
