import { Link, useOutletContext } from 'react-router'

import type { Locale } from '@/lib/locale'
import { client, urlFor, getLocalizedString } from '@/lib/sanity'
import type { Bean } from '@/lib/sanity'

import type { Route } from './+types/bean'
import * as styles from './bean.css'

const TRANSLATIONS = {
	de: {
		agtronLabel: 'Agtron',
		altitudeLabel: 'Höhe',
		backToBeans: '← Zurück zu Unseren Bohnen',
		notFoundText:
			'Die Kaffeebohne, die Sie suchen, existiert nicht oder wurde entfernt.',
		notFoundTitle: 'Bohne Nicht Gefunden',
		originLabel: 'Herkunft',
		processLabel: 'Verarbeitung',
		producerLabel: 'Produzent',
		regionLabel: 'Region',
		tastingNotesLabel: 'Verkostungsnotizen',
		varietalLabel: 'Sorte',
	},
	en: {
		agtronLabel: 'Agtron',
		altitudeLabel: 'Altitude',
		backToBeans: '← Back to Our Beans',
		notFoundText:
			"The coffee bean you're looking for doesn't exist or has been removed.",
		notFoundTitle: 'Bean Not Found',
		originLabel: 'Origin',
		processLabel: 'Process',
		producerLabel: 'Producer',
		regionLabel: 'Region',
		tastingNotesLabel: 'Tasting Notes',
		varietalLabel: 'Varietal',
	},
	es: {
		agtronLabel: 'Agtron',
		altitudeLabel: 'Altitud',
		backToBeans: '← Volver a Nuestros Granos',
		notFoundText: 'El grano de café que buscas no existe o ha sido eliminado.',
		notFoundTitle: 'Grano No Encontrado',
		originLabel: 'Origen',
		processLabel: 'Proceso',
		producerLabel: 'Productor',
		regionLabel: 'Región',
		tastingNotesLabel: 'Notas de Cata',
		varietalLabel: 'Variedad',
	},
	fr: {
		agtronLabel: 'Agtron',
		altitudeLabel: 'Altitude',
		backToBeans: '← Retour à Nos Grains',
		notFoundText:
			"Le grain de café que vous recherchez n'existe pas ou a été supprimé.",
		notFoundTitle: 'Grain Non Trouvé',
		originLabel: 'Origine',
		processLabel: 'Procédé',
		producerLabel: 'Producteur',
		regionLabel: 'Région',
		tastingNotesLabel: 'Notes de Dégustation',
		varietalLabel: 'Variété',
	},
	ja: {
		agtronLabel: 'アグトロン',
		altitudeLabel: '標高',
		backToBeans: '← コーヒー豆一覧に戻る',
		notFoundText: 'お探しのコーヒー豆は存在しないか、削除されました。',
		notFoundTitle: 'コーヒー豆が見つかりません',
		originLabel: '産地',
		processLabel: '精製方法',
		producerLabel: '生産者',
		regionLabel: '地域',
		tastingNotesLabel: 'テイスティングノート',
		varietalLabel: '品種',
	},
} as const

const BEAN_QUERY = `*[
  _type == "bean"
  && (slug.es.current == $slug || slug.en.current == $slug)
][0]{
  _id, name, slug, origin, region, producer, varietal, altitude, process, excerpt, tastingNotes, agtron, regionImage, varietalImage
}`

export async function loader({ params }: Route.LoaderArgs) {
	return { bean: await client.fetch<Bean | null>(BEAN_QUERY, params) }
}

export function meta({ data, params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const bean = data?.bean
	if (!bean) return [{ title: 'Bean Not Found - TOLO' }]

	const name = getLocalizedString(bean.name, locale, 'Untitled')
	const origin = getLocalizedString(bean.origin, locale)
	const tastingNotes = getLocalizedString(bean.tastingNotes, locale)
	const imageUrl = bean.regionImage
		? urlFor(bean.regionImage)?.width(800).url()
		: null

	return [
		{ title: `${name} - TOLO Beans` },
		{
			content: `${name} from ${origin}. ${tastingNotes}`,
			name: 'description',
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'Product',
				additionalProperty: [
					origin && {
						'@type': 'PropertyValue',
						name: 'Origin',
						value: origin,
					},
					bean.altitude && {
						'@type': 'PropertyValue',
						name: 'Altitude',
						value: `${bean.altitude}m`,
					},
					getLocalizedString(bean.process, locale) && {
						'@type': 'PropertyValue',
						name: 'Process',
						value: getLocalizedString(bean.process, locale),
					},
				].filter(Boolean),
				brand: {
					'@type': 'Brand',
					name: 'TOLO Coffee',
				},
				description: tastingNotes || getLocalizedString(bean.excerpt, locale),
				image: imageUrl,
				name,
				offers: {
					'@type': 'Offer',
					availability: 'https://schema.org/InStock',
					priceCurrency: 'MXN',
				},
			},
		},
	]
}

export default function BeanDetail({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es
	const { bean } = loaderData
	const beansPath = locale === 'en' ? 'beans' : 'granos'

	if (!bean) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<Link to={`/${locale}/${beansPath}`} className={styles.backLink}>
						{t.backToBeans}
					</Link>
					<div className={styles.notFound}>
						<h1 className={styles.notFoundTitle}>{t.notFoundTitle}</h1>
						<p className={styles.notFoundText}>{t.notFoundText}</p>
					</div>
				</div>
			</main>
		)
	}

	const name = getLocalizedString(bean.name, locale, 'Untitled')
	const origin = getLocalizedString(bean.origin, locale)
	const region = getLocalizedString(bean.region, locale)
	const producer = getLocalizedString(bean.producer, locale)
	const varietal = getLocalizedString(bean.varietal, locale)
	const process = getLocalizedString(bean.process, locale)
	const excerpt = getLocalizedString(bean.excerpt, locale)
	const tastingNotes = getLocalizedString(bean.tastingNotes, locale)

	const regionImageUrl = bean.regionImage
		? urlFor(bean.regionImage)?.width(800).height(500).url()
		: null
	const varietalImageUrl = bean.varietalImage
		? urlFor(bean.varietalImage)?.width(800).height(500).url()
		: null

	const details = [
		{ label: t.originLabel, value: origin },
		{ label: t.regionLabel, value: region },
		{ label: t.producerLabel, value: producer },
		{ label: t.varietalLabel, value: varietal },
		{
			label: t.altitudeLabel,
			value: bean.altitude ? `${bean.altitude}m` : null,
		},
		{ label: t.processLabel, value: process },
		{ label: t.agtronLabel, value: bean.agtron?.toString() },
	].filter((d) => d.value)

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<Link to={`/${locale}/${beansPath}`} className={styles.backLink}>
					{t.backToBeans}
				</Link>

				<article className={styles.article}>
					<header className={styles.header}>
						<h1 className={styles.title}>{name}</h1>
						{(origin || region) && (
							<p className={styles.origin}>
								{[origin, region].filter(Boolean).join(', ')}
							</p>
						)}
						{excerpt && <p className={styles.excerpt}>{excerpt}</p>}
					</header>

					{regionImageUrl && (
						<div className={styles.imageWrapper}>
							<img
								src={regionImageUrl}
								alt={bean.regionImage?.alt || `${name} region`}
								className={styles.image}
							/>
						</div>
					)}

					<div className={styles.detailsGrid}>
						{details.map(({ label, value }) => (
							<div key={label} className={styles.detailItem}>
								<span className={styles.detailLabel}>{label}</span>
								<span className={styles.detailValue}>{value}</span>
							</div>
						))}
					</div>

					{tastingNotes && (
						<section className={styles.tastingSection}>
							<h2 className={styles.sectionTitle}>{t.tastingNotesLabel}</h2>
							<p className={styles.tastingNotes}>{tastingNotes}</p>
						</section>
					)}

					{varietalImageUrl && (
						<div className={styles.imageWrapper}>
							<img
								src={varietalImageUrl}
								alt={bean.varietalImage?.alt || `${name} varietal`}
								className={styles.image}
							/>
						</div>
					)}
				</article>
			</div>
		</main>
	)
}
