import { useOutletContext } from 'react-router'
import type { MetaArgs } from 'react-router'

import type { Locale } from '@/lib/locale'

import * as styles from './links.css'

interface LocaleContext {
	locale: Locale
}

interface LinkItem {
	id: string
	icon: string
	labelKey: 'menu' | 'googleReviews' | 'tripadvisor' | 'appStore' | 'googlePlay'
	url: string
	section: 'main' | 'apps'
}

const LINKS: LinkItem[] = [
	{
		icon: '📋',
		id: 'menu',
		labelKey: 'menu',
		section: 'main',
		url: 'https://app.tolo.cafe',
	},
	{
		icon: '⭐',
		id: 'google-reviews',
		labelKey: 'googleReviews',
		section: 'main',
		url: 'https://g.page/r/Cfpoz19Mu8nWEBM/review',
	},
	{
		icon: '🦉',
		id: 'tripadvisor',
		labelKey: 'tripadvisor',
		section: 'main',
		url: 'https://www.tripadvisor.com.mx/Restaurant_Review-g644384-d33287081-Reviews-TOLO_Buen_Cafe-Toluca_Central_Mexico_and_Gulf_Coast.html?m=69573',
	},
	{
		icon: '🍎',
		id: 'app-store',
		labelKey: 'appStore',
		section: 'apps',
		url: 'https://apps.apple.com/app/id6749597635',
	},
	{
		icon: '🤖',
		id: 'google-play',
		labelKey: 'googlePlay',
		section: 'apps',
		url: 'https://play.google.com/store/apps/details?id=cafe.tolo.app',
	},
]

const TRANSLATIONS = {
	de: {
		appStore: 'App Store',
		appsSection: 'Unsere Apps',
		description: 'Nützliche Links für TOLO Café',
		googlePlay: 'Google Play',
		googleReviews: 'Bewerten Sie uns auf Google',
		heading: 'TOLO Café',
		menu: 'Menü ansehen',
		subtitle: 'Guter Kaffee',
		title: 'Links - TOLO',
		tripadvisor: 'Besuchen Sie uns auf TripAdvisor',
	},
	en: {
		appStore: 'App Store',
		appsSection: 'Our Apps',
		description: 'Useful links for TOLO Café',
		googlePlay: 'Google Play',
		googleReviews: 'Leave us a Google Review',
		heading: 'TOLO Café',
		menu: 'View Menu',
		subtitle: 'Good coffee',
		title: 'Links - TOLO',
		tripadvisor: 'Visit us on TripAdvisor',
	},
	es: {
		appStore: 'App Store',
		appsSection: 'Nuestras Apps',
		description: 'Enlaces útiles de TOLO Café',
		googlePlay: 'Google Play',
		googleReviews: 'Déjanos una Reseña en Google',
		heading: 'TOLO Café',
		menu: 'Ver Menú',
		subtitle: 'Buen café',
		title: 'Enlaces - TOLO',
		tripadvisor: 'Visítanos en TripAdvisor',
	},
	fr: {
		appStore: 'App Store',
		appsSection: 'Nos Applications',
		description: 'Liens utiles pour TOLO Café',
		googlePlay: 'Google Play',
		googleReviews: 'Laissez-nous un avis Google',
		heading: 'TOLO Café',
		menu: 'Voir le Menu',
		subtitle: 'Bon café',
		title: 'Liens - TOLO',
		tripadvisor: 'Visitez-nous sur TripAdvisor',
	},
	ja: {
		appStore: 'App Store',
		appsSection: 'アプリ',
		description: 'TOLO Caféの便利なリンク',
		googlePlay: 'Google Play',
		googleReviews: 'Googleレビューを書く',
		heading: 'TOLO Café',
		menu: 'メニューを見る',
		subtitle: '良いコーヒー',
		title: 'リンク - TOLO',
		tripadvisor: 'TripAdvisorで見る',
	},
} as const

export function meta({ params }: MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es

	return [
		{ title: t.title },
		{ content: t.description, name: 'description' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				description: t.description,
				mainEntity: {
					'@type': 'Organization',
					name: 'TOLO Coffee',
					url: 'https://tolo.cafe',
				},
				name: t.heading,
				url: `https://tolo.cafe/${locale}/links`,
			},
		},
	]
}

export default function Links() {
	const { locale } = useOutletContext<LocaleContext>()
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es

	const mainLinks = LINKS.filter((link) => link.section === 'main')
	const appLinks = LINKS.filter((link) => link.section === 'apps')

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>{t.heading}</h1>
					<p className={styles.subtitle}>{t.subtitle}</p>
				</header>

				<div className={styles.linksContainer}>
					{mainLinks.map((link) => (
						<a
							key={link.id}
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.linkCard}
						>
							<span className={styles.linkIcon}>{link.icon}</span>
							{t[link.labelKey]}
						</a>
					))}

					<h2 className={styles.sectionTitle}>{t.appsSection}</h2>

					<div className={styles.appLinksGrid}>
						{appLinks.map((link) => (
							<a
								key={link.id}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className={styles.linkCard}
							>
								<span className={styles.linkIcon}>{link.icon}</span>
								{t[link.labelKey]}
							</a>
						))}
					</div>
				</div>
			</div>
		</main>
	)
}
