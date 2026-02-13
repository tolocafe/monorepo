import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import {
	IconBrandApple,
	IconBrandGooglePlay,
	IconBrandTripadvisor,
	IconMenu2,
	IconStarFilled,
} from '@tabler/icons-react'
import { useOutletContext } from 'react-router'
import type { MetaArgs } from 'react-router'

import { BASE_URL, ORGANIZATION_ID } from '@/lib/constants'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'

import * as styles from './links.css'

type LocaleContext = {
	locale: Locale
}

type LinkItem = {
	id: string
	icon: React.ReactNode
	labelKey: 'menu' | 'googleReviews' | 'tripadvisor' | 'appStore' | 'googlePlay'
	url: string
	section: 'main' | 'apps'
}

const LINKS: LinkItem[] = [
	{
		icon: <IconMenu2 size={24} />,
		id: 'menu',
		labelKey: 'menu',
		section: 'main',
		url: 'https://app.tolo.cafe',
	},
	{
		icon: <IconStarFilled size={24} />,
		id: 'google-reviews',
		labelKey: 'googleReviews',
		section: 'main',
		url: 'https://g.page/r/Cfpoz19Mu8nWEBM/review',
	},
	{
		icon: <IconBrandTripadvisor size={24} />,
		id: 'tripadvisor',
		labelKey: 'tripadvisor',
		section: 'main',
		url: 'https://www.tripadvisor.com.mx/Restaurant_Review-g644384-d33287081-Reviews-TOLO_Buen_Cafe-Toluca_Central_Mexico_and_Gulf_Coast.html?m=69573',
	},
	{
		icon: <IconBrandApple size={24} />,
		id: 'app-store',
		labelKey: 'appStore',
		section: 'apps',
		url: 'https://apps.apple.com/app/id6749597635',
	},
	{
		icon: <IconBrandGooglePlay size={24} />,
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
	const canonicalUrl = `${BASE_URL}/${locale}/links`
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
				'@type': 'WebPage',
				description: t.description,
				mainEntity: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
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
