import { Trans } from '@lingui/react/macro'
import { Link, useOutletContext } from 'react-router'

import { BASE_URL, ORGANIZATION_ID } from '@/lib/constants'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import {
	client,
	urlFor,
	getLocalizedString,
	getLocalizedSlug,
	formatDate,
} from '@/lib/sanity'
import type { Post } from '@/lib/sanity'

import type { Route } from './+types/blog'
import * as styles from './blog.css'

// Meta translations for SEO (used in meta function which runs before React context)
const META_TRANSLATIONS = {
	de: {
		description:
			'Kaffeegeschichten, Tipps und Neuigkeiten von TOLO Spezialitätenkaffee',
		heading: 'Blog',
		subtitle: 'Geschichten aus der Kaffeewelt',
		title: 'Blog - TOLO',
	},
	en: {
		description: 'Coffee stories, tips, and news from TOLO specialty coffee',
		heading: 'Blog',
		subtitle: 'Stories from the coffee world',
		title: 'Blog - TOLO',
	},
	es: {
		description:
			'Historias de café, consejos y noticias de TOLO café de especialidad',
		heading: 'Blog',
		subtitle: 'Historias del mundo del café',
		title: 'Blog - TOLO',
	},
	fr: {
		description:
			'Histoires de café, conseils et actualités de TOLO café de spécialité',
		heading: 'Blog',
		subtitle: 'Histoires du monde du café',
		title: 'Blog - TOLO',
	},
	ja: {
		description:
			'TOLOスペシャルティコーヒーからのコーヒーストーリー、ヒント、ニュース',
		heading: 'ブログ',
		subtitle: 'コーヒーの世界からのストーリー',
		title: 'ブログ - TOLO',
	},
} as const

const POSTS_QUERY = `*[
  _type == "post"
  && (defined(slug.es.current) || defined(slug.en.current))
]|order(publishedAt desc)[0...12]{
  _id, name, slug, publishedAt, excerpt, image
}`

export async function loader() {
	return { posts: await client.fetch<Post[]>(POSTS_QUERY) }
}

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es
	const canonicalUrl = `${BASE_URL}/${locale}/blog`
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
				'@type': 'Blog',
				description: t.subtitle,
				name: t.heading,
				publisher: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
					logo: {
						'@type': 'ImageObject',
						url: `${BASE_URL}/favicon.png`,
					},
					name: 'TOLO',
				},
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

export default function Blog({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const { posts } = loaderData

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.heading}>
						<Trans>Blog</Trans>
					</h1>
				</header>

				<div className={styles.content}>
					{posts.length > 0 ? (
						<div className={styles.postsList}>
							{posts.map((post) => {
								const slug = getLocalizedSlug(post.slug, locale)
								if (!slug) return null

								const title = getLocalizedString(post.name, locale, 'Untitled')
								const imageUrl = post.image
									? urlFor(post.image)?.width(400).height(280).url()
									: null

								return (
									<Link
										key={post._id}
										to={`/${locale}/blog/${slug}`}
										className={styles.postCard}
									>
										{imageUrl && (
											<div className={styles.postImageWrapper}>
												<img
													src={imageUrl}
													alt={getLocalizedString(
														post.image?.alt,
														locale,
														title,
													)}
													className={styles.postImage}
												/>
											</div>
										)}
										<div className={styles.postContent}>
											<h2 className={styles.postTitle}>{title}</h2>
											{post.excerpt && (
												<p className={styles.postExcerpt}>
													{getLocalizedString(post.excerpt, locale)}
												</p>
											)}
											<time className={styles.postDate}>
												{formatDate(post.publishedAt, locale)}
											</time>
										</div>
									</Link>
								)
							})}
						</div>
					) : (
						<>
							<div className={styles.comingSoonCard}>
								<span className={styles.badge}>
									<Trans>Coming Soon</Trans>
								</span>
								<p className={styles.message}>
									<Trans>
										We are preparing amazing content for you. Our blog will
										include coffee tips, brewing guides, origin stories, and
										news from our cafés.
									</Trans>
								</p>
							</div>

							<section className={styles.previewSection}>
								<h2 className={styles.previewTitle}>
									<Trans>What to Expect</Trans>
								</h2>
								<div className={styles.topicsGrid}>
									<div className={styles.topicCard}>
										<h3 className={styles.topicTitle}>
											<Trans>Brewing Guides</Trans>
										</h3>
										<p className={styles.topicDescription}>
											<Trans>
												Step-by-step instructions for the perfect cup at home.
											</Trans>
										</p>
									</div>
									<div className={styles.topicCard}>
										<h3 className={styles.topicTitle}>
											<Trans>Coffee Origins</Trans>
										</h3>
										<p className={styles.topicDescription}>
											<Trans>
												Stories about the farms and regions where our beans come
												from.
											</Trans>
										</p>
									</div>
									<div className={styles.topicCard}>
										<h3 className={styles.topicTitle}>
											<Trans>Shop Updates</Trans>
										</h3>
										<p className={styles.topicDescription}>
											<Trans>
												News about new offerings, events, and what is happening
												at TOLO.
											</Trans>
										</p>
									</div>
								</div>
							</section>
						</>
					)}
				</div>
			</div>
		</main>
	)
}
