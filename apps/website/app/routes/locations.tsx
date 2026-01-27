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
import type { Location } from '@/lib/sanity'

import type { Route } from './+types/locations'
import * as styles from './locations.css'

const META_TRANSLATIONS = {
	de: {
		description:
			'Finden Sie TOLO Coffee Standorte in Ihrer Nähe. Besuchen Sie uns für frisch gerösteten Kaffee.',
		heading: 'Unsere Standorte',
		subtitle: 'Finden Sie uns',
		title: 'Standorte - TOLO',
	},
	en: {
		description:
			'Find TOLO Coffee locations near you. Visit us for freshly roasted coffee.',
		heading: 'Our Locations',
		subtitle: 'Find us',
		title: 'Locations - TOLO',
	},
	es: {
		description:
			'Encuentra las ubicaciones de TOLO Coffee cerca de ti. Visítanos para café recién tostado.',
		heading: 'Nuestras Ubicaciones',
		subtitle: 'Encuéntranos',
		title: 'Ubicaciones - TOLO',
	},
	fr: {
		description:
			'Trouvez les emplacements TOLO Coffee près de chez vous. Visitez-nous pour du café fraîchement torréfié.',
		heading: 'Nos Emplacements',
		subtitle: 'Trouvez-nous',
		title: 'Emplacements - TOLO',
	},
	ja: {
		description:
			'お近くのTOLO Coffeeの場所を見つけてください。焙煎したてのコーヒーをお楽しみください。',
		heading: '店舗一覧',
		subtitle: '店舗を探す',
		title: '店舗一覧 - TOLO',
	},
} as const

const LOCATIONS_QUERY = `*[
  _type == "location"
  && (defined(slug.es.current) || defined(slug.en.current))
]|order(isMainLocation desc, name.es asc)[0...50]{
  _id, name, slug, address, city, state, country, hours, image, isMainLocation
}`

export async function loader() {
	return { locations: await client.fetch<Location[]>(LOCATIONS_QUERY) }
}

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es
	const baseUrl = 'https://tolo.cafe'

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
					'@id': `${baseUrl}/#organization`,
					'@type': 'Organization',
					name: 'TOLO',
				},
				url: `${baseUrl}/${locale}/locations`,
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

export default function Locations({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const { locations } = loaderData

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>
						<Trans>Our Locations</Trans>
					</h1>
					<p className={styles.subtitle}>
						<Trans>Find us and visit for freshly roasted coffee</Trans>
					</p>
				</header>

				<div className={styles.content}>
					{locations.length > 0 ? (
						<div className={styles.locationsGrid}>
							{locations.map((location) => {
								const slug = getLocalizedSlug(location.slug, locale)
								if (!slug) return null

								const name = getLocalizedString(
									location.name,
									locale,
									'Untitled',
								)
								const address = getLocalizedString(location.address, locale)
								const hours = getLocalizedString(location.hours, locale)
								const imageUrl = location.image
									? urlFor(location.image)?.width(600).height(400).url()
									: null

								return (
									<Link
										key={location._id}
										to={`/${locale}/locations/${slug}`}
										className={styles.locationCard}
									>
										{imageUrl && (
											<div className={styles.locationImageWrapper}>
												<img
													src={imageUrl}
													alt={location.image?.alt || name}
													className={styles.locationImage}
												/>
											</div>
										)}
										<div className={styles.locationContent}>
											<div className={styles.locationHeader}>
												<h2 className={styles.locationName}>{name}</h2>
												{location.isMainLocation && (
													<span className={styles.mainBadge}>{t`Main`}</span>
												)}
											</div>
											<p className={styles.locationCity}>
												{location.city}, {location.country}
											</p>
											{address && (
												<p className={styles.locationAddress}>{address}</p>
											)}
											{hours && (
												<p className={styles.locationHours}>
													<span className={styles.hoursLabel}>{t`Hours`}:</span>{' '}
													{hours}
												</p>
											)}
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
									We are preparing our location information. Check back soon.
								</Trans>
							</p>
						</div>
					)}
				</div>
			</div>
		</main>
	)
}
