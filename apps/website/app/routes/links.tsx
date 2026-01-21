import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useOutletContext } from 'react-router'
import type { MetaArgs } from 'react-router'

import type { Locale } from '@/lib/locale'

import * as styles from './links.css'

type LocaleContext = {
	locale: Locale
}

type LinkItem = {
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

// Meta translations for SEO (used in meta function which runs before React context)
const META_TRANSLATIONS = {
	de: {
		description: 'Nützliche Links für TOLO Café',
		heading: 'TOLO Café',
		title: 'Links - TOLO',
	},
	en: {
		description: 'Useful links for TOLO Café',
		heading: 'TOLO Café',
		title: 'Links - TOLO',
	},
	es: {
		description: 'Enlaces útiles de TOLO Café',
		heading: 'TOLO Café',
		title: 'Enlaces - TOLO',
	},
	fr: {
		description: 'Liens utiles pour TOLO Café',
		heading: 'TOLO Café',
		title: 'Liens - TOLO',
	},
	ja: {
		description: 'TOLO Caféの便利なリンク',
		heading: 'TOLO Café',
		title: 'リンク - TOLO',
	},
} as const

export function meta({ params }: MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es

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
	useOutletContext<LocaleContext>()

	const mainLinks = LINKS.filter((link) => link.section === 'main')
	const appLinks = LINKS.filter((link) => link.section === 'apps')

	const linkLabels: Record<LinkItem['labelKey'], string> = {
		appStore: t`App Store`,
		googlePlay: t`Google Play`,
		googleReviews: t`Leave us a Google Review`,
		menu: t`View Menu`,
		tripadvisor: t`Visit us on TripAdvisor`,
	}

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>TOLO Café</h1>
					<p className={styles.subtitle}>
						<Trans>Good coffee</Trans>
					</p>
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
							{linkLabels[link.labelKey]}
						</a>
					))}

					<h2 className={styles.sectionTitle}>
						<Trans>Our Apps</Trans>
					</h2>

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
								{linkLabels[link.labelKey]}
							</a>
						))}
					</div>
				</div>
			</div>
		</main>
	)
}
