import { useOutletContext } from 'react-router'

import type { Locale } from '~/lib/locale'

import type { Route } from './+types/contact'
import * as styles from './contact.css'

interface LocaleContext {
	locale: Locale
}

const TRANSLATIONS = {
	de: {
		addressPlaceholder: 'Toluca, Estado de México, Mexiko',
		addressTitle: 'Besuchen Sie Uns',
		comingSoon: 'Demnächst',
		description: 'Kontaktieren Sie das TOLO Café in Toluca',
		emailPlaceholder: 'hola@tolo.cafe',
		emailTitle: 'E-Mail',
		heading: 'Kontakt',
		hoursPlaceholder: 'Mo-Fr: 8-20 Uhr\nSa-So: 9-18 Uhr',
		hoursTitle: 'Öffnungszeiten',
		message:
			'Unser Kontaktformular wird vorbereitet. In der Zwischenzeit finden Sie uns in unserem Café in Toluca oder kontaktieren Sie uns über unsere Social-Media-Kanäle.',
		subtitle: 'Wir freuen uns von Ihnen zu hören',
		title: 'Kontakt - TOLO',
	},
	en: {
		addressPlaceholder: 'Toluca, Estado de México, Mexico',
		addressTitle: 'Visit Us',
		comingSoon: 'Coming Soon',
		description: 'Get in touch with TOLO coffee shop in Toluca',
		emailPlaceholder: 'hola@tolo.cafe',
		emailTitle: 'Email',
		heading: 'Contact Us',
		hoursPlaceholder: 'Mon-Fri: 8am - 8pm\nSat-Sun: 9am - 6pm',
		hoursTitle: 'Hours',
		message:
			'Our contact form is being prepared. In the meantime, you can find us at our coffee shop in Toluca or reach out through our social media channels.',
		subtitle: "We'd love to hear from you",
		title: 'Contact Us - TOLO',
	},
	es: {
		addressPlaceholder: 'Toluca, Estado de México, México',
		addressTitle: 'Visítanos',
		comingSoon: 'Próximamente',
		description: 'Ponte en contacto con la cafetería TOLO en Toluca',
		emailPlaceholder: 'hola@tolo.cafe',
		emailTitle: 'Correo',
		heading: 'Contacto',
		hoursPlaceholder: 'Lun-Vie: 8am - 8pm\nSáb-Dom: 9am - 6pm',
		hoursTitle: 'Horario',
		message:
			'Nuestro formulario de contacto está en preparación. Mientras tanto, puedes encontrarnos en nuestra cafetería en Toluca o comunicarte a través de nuestras redes sociales.',
		subtitle: 'Nos encantaría saber de ti',
		title: 'Contacto - TOLO',
	},
	fr: {
		addressPlaceholder: 'Toluca, Estado de México, Mexique',
		addressTitle: 'Visitez-Nous',
		comingSoon: 'Bientôt Disponible',
		description: 'Contactez le café TOLO à Toluca',
		emailPlaceholder: 'hola@tolo.cafe',
		emailTitle: 'E-mail',
		heading: 'Contact',
		hoursPlaceholder: 'Lun-Ven: 8h - 20h\nSam-Dim: 9h - 18h',
		hoursTitle: 'Horaires',
		message:
			'Notre formulaire de contact est en préparation. En attendant, vous pouvez nous trouver dans notre café à Toluca ou nous contacter via nos réseaux sociaux.',
		subtitle: "Nous serions ravis d'avoir de vos nouvelles",
		title: 'Contact - TOLO',
	},
	ja: {
		addressPlaceholder: 'トルーカ、メキシコ州、メキシコ',
		addressTitle: '店舗情報',
		comingSoon: '近日公開',
		description: 'トルーカのTOLOコーヒーショップへのお問い合わせ',
		emailPlaceholder: 'hola@tolo.cafe',
		emailTitle: 'メール',
		heading: 'お問い合わせ',
		hoursPlaceholder: '月-金: 8時 - 20時\n土-日: 9時 - 18時',
		hoursTitle: '営業時間',
		message:
			'お問い合わせフォームは準備中です。それまでの間、トルーカの店舗にお越しいただくか、SNSでご連絡ください。',
		subtitle: 'お気軽にご連絡ください',
		title: 'お問い合わせ - TOLO',
	},
} as const

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es

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
	const { locale } = useOutletContext<LocaleContext>()
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>{t.heading}</h1>
					<p className={styles.subtitle}>{t.subtitle}</p>
				</header>

				<div className={styles.content}>
					<div className={styles.comingSoonCard}>
						<span className={styles.badge}>{t.comingSoon}</span>
						<p className={styles.message}>{t.message}</p>
					</div>

					<div className={styles.infoGrid}>
						<div className={styles.infoCard}>
							<h3 className={styles.infoTitle}>{t.addressTitle}</h3>
							<p className={styles.infoText}>{t.addressPlaceholder}</p>
						</div>
						<div className={styles.infoCard}>
							<h3 className={styles.infoTitle}>{t.hoursTitle}</h3>
							<p className={styles.infoText}>{t.hoursPlaceholder}</p>
						</div>
						<div className={styles.infoCard}>
							<h3 className={styles.infoTitle}>{t.emailTitle}</h3>
							<p className={styles.infoText}>{t.emailPlaceholder}</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
