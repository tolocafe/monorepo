import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import coffeeBeans from '@/assets/images/coffee-beans.jpg'
import { BASE_URL, ORGANIZATION_ID } from '@/lib/constants'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'

import type { Route } from './+types/sourcing'
import * as styles from './sourcing.css'

const META_TRANSLATIONS = {
	de: {
		description:
			'Mexikanischer Spezialitätenkaffee im Direkthandel für Großabnehmer. TOLO bezieht Kaffee von Farmen in Oaxaca, Chiapas, Veracruz und Puebla, röstet wöchentlich und beliefert Cafés, Restaurants und Büros mit erstklassigen Single-Origin-Bohnen.',
		heading: 'Großhandel & Beschaffung',
		title: 'Mexikanischer Kaffee Großhandel & Direkthandel - TOLO',
	},
	en: {
		description:
			'Direct trade Mexican specialty coffee for wholesale buyers. TOLO sources from farms in Oaxaca, Chiapas, Veracruz, and Puebla, roasts weekly, and supplies cafés, restaurants, and offices with premium single-origin beans.',
		heading: 'Wholesale & Sourcing',
		title: 'Mexican Coffee Wholesale & Direct Trade Sourcing - TOLO',
	},
	es: {
		description:
			'Café mexicano de especialidad en comercio directo para compradores mayoristas. TOLO trabaja con fincas en Oaxaca, Chiapas, Veracruz y Puebla, tuesta semanalmente y abastece cafeterías, restaurantes y oficinas con granos de origen único premium.',
		heading: 'Mayoreo y Abastecimiento',
		title: 'Café Mexicano Mayoreo y Comercio Directo - TOLO',
	},
	fr: {
		description:
			"Café de spécialité mexicain en commerce direct pour acheteurs en gros. TOLO s'approvisionne auprès de fermes à Oaxaca, Chiapas, Veracruz et Puebla, torréfie chaque semaine et fournit cafés, restaurants et bureaux en grains premium d'origine unique.",
		heading: 'Vente en Gros & Approvisionnement',
		title: 'Café Mexicain en Gros & Commerce Direct - TOLO',
	},
	ja: {
		description:
			'卸売バイヤー向けのダイレクトトレード・メキシカンスペシャルティコーヒー。TOLOはオアハカ、チアパス、ベラクルス、プエブラの農園から調達し、毎週焙煎。カフェ、レストラン、オフィスにプレミアムシングルオリジン豆を供給します。',
		heading: '卸売・調達',
		title: 'メキシココーヒー卸売＆ダイレクトトレード - TOLO',
	},
} as const

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const tr = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es
	const canonicalUrl = `${BASE_URL}/${locale}/sourcing`
	const ogLocale = OG_LOCALES[locale] || 'es_MX'

	return [
		{ href: canonicalUrl, rel: 'canonical', tagName: 'link' },
		{ title: tr.title },
		{ content: tr.description, name: 'description' },
		{ content: tr.title, property: 'og:title' },
		{ content: 'website', property: 'og:type' },
		{ content: `${BASE_URL}/og-image.png`, property: 'og:image' },
		{ content: canonicalUrl, property: 'og:url' },
		{ content: tr.description, property: 'og:description' },
		{ content: 'TOLO', property: 'og:site_name' },
		{ content: ogLocale, property: 'og:locale' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				description: tr.description,
				mainEntity: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
					name: 'TOLO',
				},
				name: tr.heading,
				specialty: 'Mexican Specialty Coffee Supplier',
				url: canonicalUrl,
			},
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'OfferCatalog',
				itemListElement: [
					{
						'@type': 'Offer',
						itemOffered: {
							'@type': 'Product',
							name: 'Mexican Single-Origin Coffee',
						},
					},
					{
						'@type': 'Offer',
						itemOffered: {
							'@type': 'Product',
							name: 'International Rotating Origins',
						},
					},
				],
				name: 'TOLO Wholesale Coffee Catalog',
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
						name: tr.heading,
						position: 2,
					},
				],
			},
		},
	]
}

export default function Sourcing() {
	const origins = [
		{
			detail: t`Bright, complex, and fruity. Zapotec and Mixtec producers.`,
			name: 'Oaxaca',
		},
		{
			detail: t`Full-bodied with chocolate notes. Altitude-grown in the Sierra Madre.`,
			name: 'Chiapas',
		},
		{
			detail: t`Smooth, nutty, and balanced. One of Mexico's oldest coffee regions.`,
			name: 'Veracruz',
		},
		{
			detail: t`Sweet and well-rounded. Emerging specialty region in central Mexico.`,
			name: 'Puebla',
		},
	]

	const steps = [
		{
			text: t`Tell us about your business, volume needs, and flavor preferences.`,
			title: t`Inquiry`,
		},
		{
			text: t`We send you curated samples so you can taste before committing.`,
			title: t`Sample`,
		},
		{
			text: t`Transparent pricing based on volume with no hidden fees.`,
			title: t`Pricing`,
		},
		{
			text: t`Roasted weekly and shipped on your schedule. Consistent quality, every time.`,
			title: t`Delivery`,
		},
	]

	const trustItems = [
		{ label: t`150+ reviews`, value: '4.9★' },
		{ label: t`Fresh roasts every week`, value: t`Weekly roasting` },
		{ label: t`Trained baristas on staff`, value: t`SCA certified` },
		{ label: t`Specialty coffee since day one`, value: t`Est. 2025` },
	]

	return (
		<main>
			{/* Hero */}
			<section className={styles.hero}>
				<div className={styles.heroInner}>
					<h1 className={styles.heroTitle}>
						<Trans>Mexican Specialty Coffee, Direct from the Farm</Trans>
					</h1>
					<p className={styles.heroSubtitle}>
						<Trans>
							Premium single-origin beans sourced directly from Mexican farms.
							Roasted weekly and delivered to your café, restaurant, or office.
						</Trans>
					</p>
					<a href="mailto:wholesale@tolo.cafe" className={styles.heroButton}>
						<Trans>Get in touch</Trans>
					</a>
				</div>
			</section>

			{/* Why TOLO */}
			<section className={styles.valueSection}>
				<div className={styles.valueGrid}>
					<div>
						<h2 className={styles.sectionTitle}>
							<Trans>Why Source with TOLO</Trans>
						</h2>
						<p className={styles.valueText}>
							<Trans>
								We work directly with farmers across Mexico to bring you
								specialty-grade coffee with full traceability. As your wholesale
								specialty coffee supplier, we handle sourcing, roasting, and
								delivery so you can focus on your business.
							</Trans>
						</p>
						<ul className={styles.benefitsList}>
							<li className={styles.benefitItem}>
								<Trans>
									Direct trade relationships with Mexican coffee farms
								</Trans>
							</li>
							<li className={styles.benefitItem}>
								<Trans>
									Roasted weekly for peak freshness — never sitting on a shelf
								</Trans>
							</li>
							<li className={styles.benefitItem}>
								<Trans>
									Flexible volumes for cafés, restaurants, hotels, and offices
								</Trans>
							</li>
							<li className={styles.benefitItem}>
								<Trans>Full traceability from farm to cup on every bag</Trans>
							</li>
							<li className={styles.benefitItem}>
								<Trans>
									SCA-certified team for brewing support and training
								</Trans>
							</li>
						</ul>
					</div>
					<img src={coffeeBeans} alt="" className={styles.valueImage} />
				</div>
			</section>

			{/* Our Origins */}
			<section className={styles.originsSection}>
				<div className={styles.originsInner}>
					<h2 className={styles.sectionTitle}>
						<Trans>Our Mexican Coffee Origins</Trans>
					</h2>
					<p className={styles.sectionSubtitle}>
						<Trans>
							We source from four key regions in Mexico, plus rotating
							international origins from Colombia, Ethiopia, Panama, and more.
						</Trans>
					</p>
					<div className={styles.originsGrid}>
						{origins.map((origin) => (
							<div key={origin.name} className={styles.originCard}>
								<h3 className={styles.originName}>{origin.name}</h3>
								<p className={styles.originDetail}>{origin.detail}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className={styles.processSection}>
				<h2 className={styles.sectionTitle}>
					<Trans>How Wholesale Sourcing Works</Trans>
				</h2>
				<p className={styles.sectionSubtitle}>
					<Trans>
						From first contact to regular delivery in four simple steps.
					</Trans>
				</p>
				<div className={styles.stepsGrid}>
					{steps.map((step, i) => (
						<div key={step.title} className={styles.stepCard}>
							<div className={styles.stepNumber}>{i + 1}</div>
							<h3 className={styles.stepTitle}>{step.title}</h3>
							<p className={styles.stepText}>{step.text}</p>
						</div>
					))}
				</div>
			</section>

			{/* Trust Signals */}
			<section className={styles.trustSection}>
				<div className={styles.trustInner}>
					<div className={styles.trustGrid}>
						{trustItems.map((item) => (
							<div key={item.label}>
								<div className={styles.trustValue}>{item.value}</div>
								<div className={styles.trustLabel}>{item.label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className={styles.cta}>
				<div className={styles.ctaInner}>
					<h2 className={styles.ctaTitle}>
						<Trans>Ready to Source Mexican Specialty Coffee?</Trans>
					</h2>
					<p className={styles.ctaText}>
						<Trans>
							Whether you run a café, restaurant, hotel, or office — we would
							love to be your coffee partner. Reach out and let&apos;s talk.
						</Trans>
					</p>
					<a href="mailto:hola@tolo.cafe" className={styles.ctaButton}>
						hola@tolo.cafe
					</a>
				</div>
			</section>
		</main>
	)
}
