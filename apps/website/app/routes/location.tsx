import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { useOutletContext } from 'react-router'

import { BASE_URL, ORGANIZATION_ID } from '@/lib/constants'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { client, urlFor, getLocalizedString } from '@/lib/sanity'
import type { Location } from '@/lib/sanity'

import type { Route } from './+types/location'
import * as styles from './location.css'

const LOCATION_QUERY = `*[
  _type == "location"
  && (slug.es.current == $slug || slug.en.current == $slug || slug.de.current == $slug || slug.fr.current == $slug || slug.ja.current == $slug)
][0]{
  _id, name, slug, description, address, city, state, country, postalCode, coordinates, phone, email, hours, image, isMainLocation
}`

export async function loader({ params }: Route.LoaderArgs) {
	return {
		location: await client.fetch<Location | null>(LOCATION_QUERY, params),
	}
}

const LOCATIONS_BREADCRUMB_LABELS: Record<Locale, string> = {
	de: 'Standorte',
	en: 'Locations',
	es: 'Ubicaciones',
	fr: 'Emplacements',
	ja: '店舗',
}

export function meta({ data, params }: Route.MetaArgs) {
	const { slug } = params
	const locale = (params.locale as Locale) || 'es'
	const location = data?.location
	if (!location) return [{ title: 'Location Not Found - TOLO' }]

	const name = getLocalizedString(location.name, locale, 'Untitled')
	const address = getLocalizedString(location.address, locale)
	const imageUrl = location.image
		? urlFor(location.image)?.width(1200).url()
		: null
	const ogLocale = OG_LOCALES[locale] || 'es_MX'
	const description = `${name} in ${location.city}, ${location.country}`
	const canonicalUrl = `${BASE_URL}/${locale}/locations/${slug}`

	return [
		{ tagName: 'link', rel: 'canonical', href: canonicalUrl },
		{ title: `${name} - TOLO Locations` },
		{ content: description, name: 'description' },
		{ content: name, property: 'og:title' },
		{ content: 'place', property: 'og:type' },
		{ content: imageUrl || `${BASE_URL}/og-image.png`, property: 'og:image' },
		{ content: canonicalUrl, property: 'og:url' },
		{ content: description, property: 'og:description' },
		{ content: 'TOLO', property: 'og:site_name' },
		{ content: ogLocale, property: 'og:locale' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@id': `${canonicalUrl}#location`,
				'@type': 'CafeOrCoffeeShop',
				acceptsReservations: false,
				address: {
					'@type': 'PostalAddress',
					addressCountry: location.country,
					addressLocality: location.city,
					addressRegion: location.state,
					postalCode: location.postalCode,
					streetAddress: address,
				},
				currenciesAccepted: 'MXN',
				description: `${name} - TOLO specialty coffee in ${location.city}, ${location.country}`,
				email: location.email,
				geo: location.coordinates && {
					'@type': 'GeoCoordinates',
					latitude: location.coordinates.lat,
					longitude: location.coordinates.lng,
				},
				hasMenu: `${BASE_URL}/${locale}#menu`,
				image: imageUrl,
				name,
				openingHoursSpecification: [
					{
						'@type': 'OpeningHoursSpecification',
						closes: '19:30',
						dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
						opens: '07:30',
					},
					{
						'@type': 'OpeningHoursSpecification',
						closes: '17:00',
						dayOfWeek: 'Saturday',
						opens: '09:00',
					},
				],
				parentOrganization: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
					name: 'TOLO',
				},
				paymentAccepted: 'Cash, Credit Card',
				priceRange: '$$',
				servesCuisine: ['Coffee', 'Tea', 'Pastries'],
				telephone: location.phone,
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
						item: `${BASE_URL}/${locale}`,
						name: 'TOLO',
						position: 1,
					},
					{
						'@type': 'ListItem',
						item: `${BASE_URL}/${locale}/locations`,
						name: LOCATIONS_BREADCRUMB_LABELS[locale] || 'Locations',
						position: 2,
					},
					{
						'@type': 'ListItem',
						name,
						position: 3,
					},
				],
			},
		},
	]
}

const portableTextComponents: PortableTextComponents = {
	block: {
		h2: ({ children }) => <h2 className={styles.heading2}>{children}</h2>,
		h3: ({ children }) => <h3 className={styles.heading3}>{children}</h3>,
		normal: ({ children }) => <p className={styles.paragraph}>{children}</p>,
	},
	list: {
		bullet: ({ children }) => <ul className={styles.list}>{children}</ul>,
		number: ({ children }) => <ol className={styles.list}>{children}</ol>,
	},
	listItem: {
		bullet: ({ children }) => <li className={styles.listItem}>{children}</li>,
		number: ({ children }) => <li className={styles.listItem}>{children}</li>,
	},
}

export default function LocationDetail({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const { location } = loaderData

	if (!location) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<div className={styles.notFound}>
						<h1 className={styles.notFoundTitle}>
							<Trans>Location Not Found</Trans>
						</h1>
						<p className={styles.notFoundText}>
							<Trans>
								The location you are looking for does not exist or has been
								removed.
							</Trans>
						</p>
					</div>
				</div>
			</main>
		)
	}

	const name = getLocalizedString(location.name, locale, 'Untitled')
	const address = getLocalizedString(location.address, locale)
	const hours = getLocalizedString(location.hours, locale)
	const description = location.description?.[locale] || location.description?.es
	const imageUrl = location.image
		? urlFor(location.image)?.width(1200).height(675).url()
		: null

	const fullAddress = [
		address,
		location.city,
		location.state,
		location.country,
		location.postalCode,
	]
		.filter(Boolean)
		.join(', ')

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<article className={styles.article}>
					<header className={styles.header}>
						<h1 className={styles.title}>{name}</h1>
						<p className={styles.location}>
							{location.city}, {location.country}
						</p>
					</header>

					{imageUrl && (
						<div className={styles.imageWrapper}>
							<img
								src={imageUrl}
								alt={location.image?.alt || name}
								className={styles.image}
							/>
						</div>
					)}

					{description && Array.isArray(description) && (
						<div className={styles.body}>
							<PortableText
								value={description}
								components={portableTextComponents}
							/>
						</div>
					)}

					<div className={styles.detailsGrid}>
						{fullAddress && (
							<div className={styles.detailItem}>
								<span className={styles.detailLabel}>{t`Address`}</span>
								<span className={styles.detailValue}>{fullAddress}</span>
							</div>
						)}
						{hours && (
							<div className={styles.detailItem}>
								<span className={styles.detailLabel}>{t`Hours`}</span>
								<span className={styles.detailValue}>{hours}</span>
							</div>
						)}
						{location.phone && (
							<div className={styles.detailItem}>
								<span className={styles.detailLabel}>{t`Phone`}</span>
								<a href={`tel:${location.phone}`} className={styles.detailLink}>
									{location.phone}
								</a>
							</div>
						)}
						{location.email && (
							<div className={styles.detailItem}>
								<span className={styles.detailLabel}>{t`Email`}</span>
								<a
									href={`mailto:${location.email}`}
									className={styles.detailLink}
								>
									{location.email}
								</a>
							</div>
						)}
					</div>

					{location.coordinates && (
						<div className={styles.mapWrapper}>
							<iframe
								sandbox="allow-scripts"
								src={`https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}&z=15&output=embed`}
								className={styles.map}
								loading="lazy"
								title={`Map of ${name}`}
							/>
						</div>
					)}
				</article>
			</div>
		</main>
	)
}
