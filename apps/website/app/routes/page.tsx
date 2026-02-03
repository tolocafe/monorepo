import { Trans } from '@lingui/react/macro'
import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { Link, useOutletContext } from 'react-router'

import AppStoreBadge from '@/assets/logos/app-store.svg'
import GooglePlayBadge from '@/assets/logos/google-play.svg'
import { BASE_URL, ORGANIZATION_ID } from '@/lib/constants'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { client, getLocalizedString } from '@/lib/sanity'
import type { Page } from '@/lib/sanity'

import type { Route } from './+types/page'
import * as styles from './page.css'

const APP_STORE_URL = 'https://apps.apple.com/app/tolo-buen-cafe/id6749597635'
const GOOGLE_PLAY_URL =
	'https://play.google.com/store/apps/details?id=cafe.tolo.app'

const APP_SLUGS = ['app', 'aplicacion'] as const

const LOCALE_PATHS = {
	de: { beansPath: 'beans' },
	en: { beansPath: 'beans' },
	es: { beansPath: 'granos' },
	fr: { beansPath: 'beans' },
	ja: { beansPath: 'beans' },
} as const

const ABOUT_SLUGS = ['about', 'nosotros', 'a-propos', 'ueber-uns'] as const

const PAGE_QUERY = `*[
  _type == "page"
  && (slug.es.current == $slug || slug.en.current == $slug)
][0]{
  _id, name, slug, excerpt, body
}`

export async function loader({ params }: Route.LoaderArgs) {
	return { page: await client.fetch<Page | null>(PAGE_QUERY, params) }
}

export function meta({ data, params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const page = data?.page
	if (!page) return [{ title: 'Page Not Found - TOLO' }]

	const title = getLocalizedString(page.name, locale, 'Untitled')
	const excerpt = getLocalizedString(page.excerpt, locale)
	const slug = params.slug || ''
	const ogLocale = OG_LOCALES[locale] || 'es_MX'
	const canonicalUrl = `${BASE_URL}/${locale}/${slug}`

	// Determine page type
	const isAboutPage =
		slug.includes('about') || slug.includes('acerca') || slug.includes('sobre')
	const isAppPage = APP_SLUGS.some((appSlug) => slug === appSlug)

	// Pages that should be hidden from search engines
	const noIndexSlugs = [
		'investors',
		'inversionistas',
		'investisseurs',
		'investoren',
		'investidores',
	]
	const shouldNoIndex = noIndexSlugs.includes(slug)

	// OG image: use app screenshot for app page, default otherwise
	const ogImage = isAppPage
		? `${BASE_URL}/app/screenshot.png`
		: `${BASE_URL}/og-image.png`

	const metaTags: ReturnType<typeof Array<Record<string, unknown>>> = [
		{ tagName: 'link', rel: 'canonical', href: canonicalUrl },
		{ title: `${title} - TOLO` },
		{ content: excerpt, name: 'description' },
		{ content: title, property: 'og:title' },
		{ content: 'website', property: 'og:type' },
		{ content: ogImage, property: 'og:image' },
		{ content: canonicalUrl, property: 'og:url' },
		{ content: excerpt, property: 'og:description' },
		{ content: 'TOLO', property: 'og:site_name' },
		{ content: ogLocale, property: 'og:locale' },
	]

	// Add page-type specific structured data
	if (isAppPage) {
		metaTags.push({
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@id': `${BASE_URL}/#app`,
				'@type': 'MobileApplication',
				aggregateRating: {
					'@type': 'AggregateRating',
					ratingCount: 1,
					ratingValue: 5,
				},
				applicationCategory: 'ShoppingApplication',
				description: excerpt,
				downloadUrl: [APP_STORE_URL, GOOGLE_PLAY_URL],
				featureList: [
					'View menu and prices',
					'Order ahead for pickup',
					'Earn loyalty rewards',
					'Find nearby locations',
				],
				inLanguage: ['es', 'en', 'fr', 'de', 'ja'],
				name: 'TOLO - Buen Café',
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD',
				},
				operatingSystem: 'iOS 15.0+, Android 8.0+',
				publisher: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
					name: 'TOLO',
				},
				screenshot: `${BASE_URL}/app/screenshot.png`,
				softwareVersion: '1.0',
				url: canonicalUrl,
			},
		})
	} else {
		metaTags.push({
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': isAboutPage ? 'AboutPage' : 'WebPage',
				description: excerpt,
				name: title,
				publisher: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
					name: 'TOLO',
				},
				url: canonicalUrl,
			},
		})
	}

	// Add BreadcrumbList for all pages
	metaTags.push({
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
					name: title,
					position: 2,
				},
			],
		},
	})

	if (shouldNoIndex) {
		metaTags.push({ content: 'noindex, nofollow', name: 'robots' })
	}

	return metaTags
}

const portableTextComponents: PortableTextComponents = {
	block: {
		blockquote: ({ children }) => (
			<blockquote className={styles.blockquote}>{children}</blockquote>
		),
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
	marks: {
		link: ({ children, value }) => (
			<a
				href={value?.href}
				className={styles.link}
				target="_blank"
				rel="noopener noreferrer"
			>
				{children}
			</a>
		),
	},
}

export default function PageRoute({
	loaderData,
	params,
}: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const { page } = loaderData
	const slug = params.slug || ''
	const isAboutPage = ABOUT_SLUGS.some((aboutSlug) => slug === aboutSlug)
	const isAppPage = APP_SLUGS.some((appSlug) => slug === appSlug)
	const paths = LOCALE_PATHS[locale] || LOCALE_PATHS.es

	if (!page) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<div className={styles.notFound}>
						<h1 className={styles.notFoundTitle}>
							<Trans>Page Not Found</Trans>
						</h1>
						<p className={styles.notFoundText}>
							<Trans>The page you are looking for does not exist.</Trans>
						</p>
					</div>
				</div>
			</main>
		)
	}

	const title = getLocalizedString(page.name, locale, 'Untitled')
	const body = page.body?.[locale] || page.body?.es

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.title}>{title}</h1>
				</header>

				{body && Array.isArray(body) && (
					<div className={styles.body}>
						<PortableText value={body} components={portableTextComponents} />
					</div>
				)}

				{isAboutPage && (
					<nav className={styles.aboutLinks}>
						<Link
							to={`/${locale}/${paths.beansPath}`}
							className={styles.aboutLink}
						>
							<Trans>Our Beans</Trans>
						</Link>
						<Link to={`/${locale}/blog`} className={styles.aboutLink}>
							<Trans>Blog</Trans>
						</Link>
					</nav>
				)}

				{isAppPage && (
					<section className={styles.downloadSection}>
						<h2 className={styles.downloadTitle}>
							<Trans>Download the App</Trans>
						</h2>
						<div className={styles.storeLinks}>
							<a
								href={APP_STORE_URL}
								target="_blank"
								rel="noreferrer"
								className={styles.storeLink}
							>
								<img
									src={AppStoreBadge}
									alt="Download on the App Store"
									className={styles.storeBadge}
								/>
							</a>
							<a
								href={GOOGLE_PLAY_URL}
								target="_blank"
								rel="noreferrer"
								className={styles.storeLink}
							>
								<img
									src={GooglePlayBadge}
									alt="Get it on Google Play"
									className={styles.storeBadge}
								/>
							</a>
						</div>
					</section>
				)}
			</div>
		</main>
	)
}
