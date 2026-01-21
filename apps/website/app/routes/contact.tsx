import { Trans } from '@lingui/react/macro'
import { useOutletContext } from 'react-router'

import type { Locale } from '@/lib/locale'

import type { Route } from './+types/contact'
import * as styles from './contact.css'

interface LocaleContext {
	locale: Locale
}

// Meta translations for SEO (used in meta function which runs before React context)
const META_TRANSLATIONS = {
	de: {
		description: 'Kontaktieren Sie das TOLO Café in Toluca',
		heading: 'Kontakt',
		title: 'Kontakt - TOLO',
	},
	en: {
		description: 'Get in touch with TOLO coffee shop in Toluca',
		heading: 'Contact Us',
		title: 'Contact Us - TOLO',
	},
	es: {
		description: 'Ponte en contacto con la cafetería TOLO en Toluca',
		heading: 'Contacto',
		title: 'Contacto - TOLO',
	},
	fr: {
		description: 'Contactez le café TOLO à Toluca',
		heading: 'Contact',
		title: 'Contact - TOLO',
	},
	ja: {
		description: 'トルーカのTOLOコーヒーショップへのお問い合わせ',
		heading: 'お問い合わせ',
		title: 'お問い合わせ - TOLO',
	},
} as const

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es

	return [
		{ title: t.title },
		{ content: t.description, name: 'description' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'ContactPage',
				description: t.description,
				mainEntity: {
					'@type': 'Organization',
					address: {
						'@type': 'PostalAddress',
						addressCountry: 'MX',
						addressLocality: 'Toluca',
						addressRegion: 'Estado de México',
					},
					email: 'hola@tolo.cafe',
					name: 'TOLO Coffee',
				},
				name: t.heading,
				url: `https://tolo.cafe/${locale}/contact`,
			},
		},
	]
}

export default function Contact() {
	useOutletContext<LocaleContext>()

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
								find us at our café in Toluca or reach out through our social
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
								Toluca, Estado de México, México
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
