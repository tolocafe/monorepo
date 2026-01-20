import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { useOutletContext } from 'react-router'

import type { Locale } from '@/lib/locale'
import { client, urlFor, getLocalizedString } from '@/lib/sanity'
import type { Location } from '@/lib/sanity'

import type { Route } from './+types/location'
import * as styles from './location.css'

const TRANSLATIONS = {
	de: {
		addressLabel: 'Adresse',
		backToLocations: '← Zurück zu Standorten',
		emailLabel: 'E-Mail',
		hoursLabel: 'Öffnungszeiten',
		notFoundText:
			'Der Standort, den Sie suchen, existiert nicht oder wurde entfernt.',
		notFoundTitle: 'Standort Nicht Gefunden',
		phoneLabel: 'Telefon',
	},
	en: {
		addressLabel: 'Address',
		backToLocations: '← Back to Locations',
		emailLabel: 'Email',
		hoursLabel: 'Hours',
		notFoundText:
			"The location you're looking for doesn't exist or has been removed.",
		notFoundTitle: 'Location Not Found',
		phoneLabel: 'Phone',
	},
	es: {
		addressLabel: 'Dirección',
		backToLocations: '← Volver a Ubicaciones',
		emailLabel: 'Correo',
		hoursLabel: 'Horario',
		notFoundText: 'La ubicación que buscas no existe o ha sido eliminada.',
		notFoundTitle: 'Ubicación No Encontrada',
		phoneLabel: 'Teléfono',
	},
	fr: {
		addressLabel: 'Adresse',
		backToLocations: '← Retour aux Emplacements',
		emailLabel: 'E-mail',
		hoursLabel: 'Horaires',
		notFoundText:
			"L'emplacement que vous recherchez n'existe pas ou a été supprimé.",
		notFoundTitle: 'Emplacement Non Trouvé',
		phoneLabel: 'Téléphone',
	},
	ja: {
		addressLabel: '住所',
		backToLocations: '← 店舗一覧に戻る',
		emailLabel: 'メール',
		hoursLabel: '営業時間',
		notFoundText: 'お探しの店舗は存在しないか、削除されました。',
		notFoundTitle: '店舗が見つかりません',
		phoneLabel: '電話',
	},
} as const

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

export function meta({ data, params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const location = data?.location
	if (!location) return [{ title: 'Location Not Found - TOLO' }]

	const name = getLocalizedString(location.name, locale, 'Untitled')
	const address = getLocalizedString(location.address, locale)
	const hours = getLocalizedString(location.hours, locale)
	const imageUrl = location.image
		? urlFor(location.image)?.width(1200).url()
		: null

	return [
		{ title: `${name} - TOLO Locations` },
		{
			content: `${name} in ${location.city}, ${location.country}`,
			name: 'description',
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'CoffeeShop',
				address: {
					'@type': 'PostalAddress',
					addressCountry: location.country,
					addressLocality: location.city,
					addressRegion: location.state,
					postalCode: location.postalCode,
					streetAddress: address,
				},
				email: location.email,
				geo: location.coordinates && {
					'@type': 'GeoCoordinates',
					latitude: location.coordinates.lat,
					longitude: location.coordinates.lng,
				},
				image: imageUrl,
				name,
				openingHours: hours,
				priceRange: '$$',
				servesCuisine: 'Coffee',
				telephone: location.phone,
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
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es
	const { location } = loaderData

	if (!location) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<div className={styles.notFound}>
						<h1 className={styles.notFoundTitle}>{t.notFoundTitle}</h1>
						<p className={styles.notFoundText}>{t.notFoundText}</p>
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
								<span className={styles.detailLabel}>{t.addressLabel}</span>
								<span className={styles.detailValue}>{fullAddress}</span>
							</div>
						)}
						{hours && (
							<div className={styles.detailItem}>
								<span className={styles.detailLabel}>{t.hoursLabel}</span>
								<span className={styles.detailValue}>{hours}</span>
							</div>
						)}
						{location.phone && (
							<div className={styles.detailItem}>
								<span className={styles.detailLabel}>{t.phoneLabel}</span>
								<a href={`tel:${location.phone}`} className={styles.detailLink}>
									{location.phone}
								</a>
							</div>
						)}
						{location.email && (
							<div className={styles.detailItem}>
								<span className={styles.detailLabel}>{t.emailLabel}</span>
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
