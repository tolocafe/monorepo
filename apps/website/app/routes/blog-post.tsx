import { Trans } from '@lingui/react/macro'
import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { Link, useOutletContext } from 'react-router'

import { BASE_URL, ORGANIZATION_ID } from '@/lib/constants'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { client, urlFor, getLocalizedString, formatDate } from '@/lib/sanity'
import type { Post } from '@/lib/sanity'

import type { Route } from './+types/blog-post'
import * as styles from './blog-post.css'

const POST_QUERY = `*[
  _type == "post"
  && (slug.es.current == $slug || slug.en.current == $slug)
][0]{
  _id, _updatedAt, name, slug, publishedAt, excerpt, body, image
}`

const SUGGESTED_POSTS_QUERY = `*[
  _type == "post"
  && _id != $currentId
  && defined(publishedAt)
] | order(publishedAt desc)[0...3]{
  _id, name, slug, publishedAt, excerpt, image
}`

export async function loader({ params }: Route.LoaderArgs) {
	const post = await client.fetch<Post | null>(POST_QUERY, params)
	const suggestedPosts = post
		? await client.fetch<Post[]>(SUGGESTED_POSTS_QUERY, { currentId: post._id })
		: []
	return { post, suggestedPosts }
}

export function meta({ data, params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const post = data?.post
	if (!post) return [{ title: 'Post Not Found - TOLO' }]

	const title = getLocalizedString(post.name, locale, 'Untitled')
	const excerpt = getLocalizedString(post.excerpt, locale)
	const ogLocale = OG_LOCALES[locale] || 'es_MX'
	const canonicalUrl = `${BASE_URL}/${locale}/blog/${params.slug}`

	// Generate multiple image sizes for structured data (Google recommends 16:9, 4:3, 1:1)
	const images = post.image
		? [
				urlFor(post.image)?.width(1200).height(675).url(), // 16:9
				urlFor(post.image)?.width(1200).height(900).url(), // 4:3
				urlFor(post.image)?.width(1200).height(1200).url(), // 1:1
			].filter(Boolean)
		: []
	const ogImage = images[0] || `${BASE_URL}/og-image.png`

	return [
		{ tagName: 'link', rel: 'canonical', href: canonicalUrl },
		{ title: `${title} - TOLO Blog` },
		{ content: excerpt, name: 'description' },
		{ content: title, property: 'og:title' },
		{ content: 'article', property: 'og:type' },
		{ content: ogImage, property: 'og:image' },
		{ content: '1200', property: 'og:image:width' },
		{ content: '675', property: 'og:image:height' },
		{ content: canonicalUrl, property: 'og:url' },
		{ content: excerpt, property: 'og:description' },
		{ content: 'TOLO', property: 'og:site_name' },
		{ content: ogLocale, property: 'og:locale' },
		{ content: post.publishedAt, property: 'article:published_time' },
		...(post._updatedAt
			? [{ content: post._updatedAt, property: 'article:modified_time' }]
			: []),
		{ content: 'TOLO', property: 'article:author' },
		{ content: 'Coffee', property: 'article:section' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'Article',
				author: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
					name: 'TOLO',
				},
				dateModified: post._updatedAt || post.publishedAt,
				datePublished: post.publishedAt,
				description: excerpt,
				headline: title,
				image: images,
				mainEntityOfPage: {
					'@id': canonicalUrl,
					'@type': 'WebPage',
				},
				publisher: {
					'@id': ORGANIZATION_ID,
					'@type': 'Organization',
					logo: {
						'@type': 'ImageObject',
						url: `${BASE_URL}/favicon.png`,
					},
					name: 'TOLO',
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
						item: `${BASE_URL}/${locale}`,
						name: 'TOLO',
						position: 1,
					},
					{
						'@type': 'ListItem',
						item: `${BASE_URL}/${locale}/blog`,
						name: 'Blog',
						position: 2,
					},
					{
						'@type': 'ListItem',
						name: title,
						position: 3,
					},
				],
			},
		},
	]
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
		em: ({ children }) => <em>{children}</em>,
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
		strong: ({ children }) => <strong>{children}</strong>,
		underline: ({ children }) => <u>{children}</u>,
	},
}

export default function BlogPost({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const { post, suggestedPosts } = loaderData

	if (!post) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<Link to={`/${locale}/blog`} className={styles.backLink}>
						<Trans>← Back to Blog</Trans>
					</Link>
					<div className={styles.notFound}>
						<h1 className={styles.notFoundTitle}>
							<Trans>Post Not Found</Trans>
						</h1>
						<p className={styles.notFoundText}>
							<Trans>
								The post you are looking for does not exist or has been removed.
							</Trans>
						</p>
					</div>
				</div>
			</main>
		)
	}

	const title = getLocalizedString(post.name, locale, 'Untitled')
	const body = post.body?.[locale] || post.body?.es
	const imageUrl = post.image
		? urlFor(post.image)?.width(1200).height(675).url()
		: null

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<Link to={`/${locale}/blog`} className={styles.backLink}>
					<Trans>← Back to Blog</Trans>
				</Link>

				<article className={styles.article}>
					<header className={styles.header}>
						<h1 className={styles.title}>{title}</h1>
						<div className={styles.meta}>
							<time className={styles.date}>
								{formatDate(post.publishedAt, locale)}
							</time>
						</div>
					</header>

					{imageUrl && (
						<div className={styles.imageWrapper}>
							<img
								src={imageUrl}
								alt={post.image?.alt || title}
								className={styles.image}
							/>
						</div>
					)}

					{body && Array.isArray(body) && (
						<div className={styles.body}>
							<PortableText value={body} components={portableTextComponents} />
						</div>
					)}
				</article>

				{suggestedPosts.length > 0 && (
					<section className={styles.suggestedSection}>
						<h2 className={styles.suggestedTitle}>
							<Trans>Suggested Readings</Trans>
						</h2>
						<div className={styles.suggestedGrid}>
							{suggestedPosts.map((suggestedPost) => {
								const suggestedTitle = getLocalizedString(
									suggestedPost.name,
									locale,
									'Untitled',
								)
								const suggestedExcerpt = getLocalizedString(
									suggestedPost.excerpt,
									locale,
								)
								const suggestedSlug =
									suggestedPost.slug?.[locale]?.current ||
									suggestedPost.slug?.es?.current
								const suggestedImageUrl = suggestedPost.image
									? urlFor(suggestedPost.image)?.width(400).height(225).url()
									: null

								return (
									<Link
										key={suggestedPost._id}
										to={`/${locale}/blog/${suggestedSlug}`}
										className={styles.suggestedCard}
									>
										{suggestedImageUrl && (
											<div className={styles.suggestedImageWrapper}>
												<img
													src={suggestedImageUrl}
													alt={suggestedPost.image?.alt || suggestedTitle}
													className={styles.suggestedImage}
												/>
											</div>
										)}
										<div className={styles.suggestedContent}>
											<h3 className={styles.suggestedCardTitle}>
												{suggestedTitle}
											</h3>
											{suggestedExcerpt && (
												<p className={styles.suggestedExcerpt}>
													{suggestedExcerpt}
												</p>
											)}
											<time className={styles.suggestedDate}>
												{formatDate(suggestedPost.publishedAt, locale)}
											</time>
										</div>
									</Link>
								)
							})}
						</div>
					</section>
				)}
			</div>
		</main>
	)
}
