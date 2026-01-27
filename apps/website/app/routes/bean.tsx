import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Link, useOutletContext } from 'react-router'

import type { Locale } from '@/lib/locale'
import { client, urlFor, getLocalizedString } from '@/lib/sanity'
import type { Bean } from '@/lib/sanity'

import type { Route } from './+types/bean'
import * as styles from './bean.css'

const BEAN_QUERY = `*[
  _type == "bean"
  && (slug.es.current == $slug || slug.en.current == $slug)
][0]{
  _id, name, slug, origin, region, producer, varietal, altitude, process, excerpt, tastingNotes, agtron, regionImage, varietalImage
}`

export async function loader({ params }: Route.LoaderArgs) {
	return { bean: await client.fetch<Bean | null>(BEAN_QUERY, params) }
}

const BEANS_BREADCRUMB_LABELS: Record<Locale, string> = {
	de: 'Bohnen',
	en: 'Beans',
	es: 'Granos',
	fr: 'Grains',
	ja: '豆',
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
	const baseUrl = 'https://tolo.cafe'
	const beansPath = locale === 'es' ? 'granos' : 'beans'

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
					'@id': 'https://tolo.cafe/#organization',
					'@type': 'Organization',
					name: 'TOLO',
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
						item: `${baseUrl}/${locale}/${beansPath}`,
						name: BEANS_BREADCRUMB_LABELS[locale] || 'Beans',
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

export default function BeanDetail({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const { bean } = loaderData
	const beansPath = locale === 'en' ? 'beans' : 'granos'

	if (!bean) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<Link to={`/${locale}/${beansPath}`} className={styles.backLink}>
						<Trans>← Back to Our Beans</Trans>
					</Link>
					<div className={styles.notFound}>
						<h1 className={styles.notFoundTitle}>
							<Trans>Bean Not Found</Trans>
						</h1>
						<p className={styles.notFoundText}>
							<Trans>
								The coffee bean you are looking for does not exist or has been
								removed.
							</Trans>
						</p>
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
		{ label: t`Origin`, value: origin },
		{ label: t`Region`, value: region },
		{ label: t`Producer`, value: producer },
		{ label: t`Varietal`, value: varietal },
		{
			label: t`Altitude`,
			value: bean.altitude ? `${bean.altitude}m` : null,
		},
		{ label: t`Process`, value: process },
		{ label: t`Agtron`, value: bean.agtron?.toString() },
	].filter((d) => d.value)

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<Link to={`/${locale}/${beansPath}`} className={styles.backLink}>
					<Trans>← Back to Our Beans</Trans>
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
							<h2 className={styles.sectionTitle}>
								<Trans>Tasting Notes</Trans>
							</h2>
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
