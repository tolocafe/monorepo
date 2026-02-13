import { Trans } from '@lingui/react/macro'
import { Link, useOutletContext } from 'react-router'

import { BASE_URL, ORGANIZATION_ID } from '@/lib/constants'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'

import type { Route } from './+types/contact'
import * as styles from './contact.css'

interface LocaleContext {
	locale: Locale
}

// Meta translations for SEO (used in meta function which runs before React context)
const META_TRANSLATIONS = {
	de: {
		description: 'Kontaktieren Sie TOLO Spezialitätenkaffee',
		heading: 'Kontakt',
		title: 'Kontakt - TOLO',
	},
	en: {
		description: 'Get in touch with TOLO specialty coffee',
		heading: 'Contact Us',
		title: 'Contact Us - TOLO',
	},
	es: {
		description: 'Ponte en contacto con TOLO café de especialidad',
		heading: 'Contacto',
		title: 'Contacto - TOLO',
	},
	fr: {
		description: 'Contactez TOLO café de spécialité',
		heading: 'Contact',
		title: 'Contact - TOLO',
	},
	ja: {
		description: 'TOLOスペシャルティコーヒーへのお問い合わせ',
		heading: 'お問い合わせ',
		title: 'お問い合わせ - TOLO',
	},
} as const

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es
	const canonicalUrl = `${BASE_URL}/${locale}/contact`
	const ogLocale = OG_LOCALES[locale] || 'es_MX'

	return [
		{ href: canonicalUrl, rel: 'canonical', tagName: 'link' },
		{ title: t.title },
		{ content: t.description, name: 'description' },
		{ content: t.title, property: 'og:title' },
		{ content: 'website', property: 'og:type' },
		{ content: `${BASE_URL}/og-image.png`, property: 'og:image' },
		{ content: canonicalUrl, property: 'og:url' },
		{ content: t.description, property: 'og:description' },
		{ content: 'TOLO', property: 'og:site_name' },
		{ content: ogLocale, property: 'og:locale' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'ContactPage',
				description: t.description,
				mainEntity: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
					email: 'hola@tolo.cafe',
					name: 'TOLO',
				},
				name: t.heading,
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
						name: t.heading,
						position: 2,
					},
				],
			},
		},
	]
}

export default function Contact() {
	const { locale } = useOutletContext<LocaleContext>()

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>
						<Trans>Contact Us</Trans>
					</h1>
					<p className={styles.subtitle}>
						<Trans>We would love to hear from you</Trans>
					</p>
				</header>

				<div className={styles.content}>
					<div className={styles.comingSoonCard}>
						<span className={styles.badge}>
							<Trans>Coming Soon</Trans>
						</span>
						<p className={styles.message}>
							<Trans>
								Our contact form is in preparation. In the meantime, you can
								find us at any of our locations or reach out through our social
								media.
							</Trans>
						</p>
					</div>

					<div className={styles.infoGrid}>
						<div className={styles.infoCard}>
							<h3 className={styles.infoTitle}>
								<Trans>Visit Us</Trans>
							</h3>
							<p className={styles.infoText}>
								<Link to={`/${locale}/locations`}>
									<Trans>See our locations</Trans>
								</Link>
							</p>
						</div>
						<div className={styles.infoCard}>
							<h3 className={styles.infoTitle}>
								<Trans>Hours</Trans>
							</h3>
							<p className={styles.infoText}>
								<Trans>Mon-Fri: 8am - 8pm</Trans>
								<br />
								<Trans>Sat-Sun: 9am - 6pm</Trans>
							</p>
						</div>
						<div className={styles.infoCard}>
							<h3 className={styles.infoTitle}>
								<Trans>Email</Trans>
							</h3>
							<p className={styles.infoText}>hola@tolo.cafe</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
