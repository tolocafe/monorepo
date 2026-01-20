import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { Link, useOutletContext } from 'react-router'

import type { Locale } from '@/lib/locale'
import { client, urlFor, getLocalizedString, formatDate } from '@/lib/sanity'
import type { Post } from '@/lib/sanity'

import type { Route } from './+types/blog-post'
import * as styles from './blog-post.css'

const TRANSLATIONS = {
	de: {
		backToBlogs: '← Zurück zum Blog',
		notFoundText:
			'Der Beitrag, den Sie suchen, existiert nicht oder wurde entfernt.',
		notFoundTitle: 'Beitrag Nicht Gefunden',
	},
	en: {
		backToBlogs: '← Back to Blog',
		notFoundText:
			"The post you're looking for doesn't exist or has been removed.",
		notFoundTitle: 'Post Not Found',
	},
	es: {
		backToBlogs: '← Volver al Blog',
		notFoundText: 'La publicación que buscas no existe o ha sido eliminada.',
		notFoundTitle: 'Publicación No Encontrada',
	},
	fr: {
		backToBlogs: '← Retour au Blog',
		notFoundText:
			"L'article que vous recherchez n'existe pas ou a été supprimé.",
		notFoundTitle: 'Article Non Trouvé',
	},
	ja: {
		backToBlogs: '← ブログに戻る',
		notFoundText: 'お探しの記事は存在しないか、削除されました。',
		notFoundTitle: '記事が見つかりません',
	},
} as const

const POST_QUERY = `*[
  _type == "post"
  && (slug.es.current == $slug || slug.en.current == $slug)
][0]{
  _id, name, slug, publishedAt, excerpt, body, image
}`

export async function loader({ params }: Route.LoaderArgs) {
	return { post: await client.fetch<Post | null>(POST_QUERY, params) }
}

export function meta({ data, params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const post = data?.post
	if (!post) return [{ title: 'Post Not Found - TOLO' }]

	const title = getLocalizedString(post.name, locale, 'Untitled')
	const excerpt = getLocalizedString(post.excerpt, locale)
	const imageUrl = post.image ? urlFor(post.image)?.width(1200).url() : null

	return [
		{ title: `${title} - TOLO Blog` },
		{ content: excerpt, name: 'description' },
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'BlogPosting',
				author: {
					'@type': 'Organization',
					name: 'TOLO Coffee',
				},
				dateModified: post._updatedAt || post.publishedAt,
				datePublished: post.publishedAt,
				description: excerpt,
				headline: title,
				image: imageUrl,
				mainEntityOfPage: {
					'@id': `https://tolo.cafe/${locale}/blog/${params.slug}`,
					'@type': 'WebPage',
				},
				publisher: {
					'@type': 'Organization',
					logo: {
						'@type': 'ImageObject',
						url: 'https://tolo.cafe/favicon.png',
					},
					name: 'TOLO Coffee',
				},
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

export default function BlogPost({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es
	const { post } = loaderData

	if (!post) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<Link to={`/${locale}/blog`} className={styles.backLink}>
						{t.backToBlogs}
					</Link>
					<div className={styles.notFound}>
						<h1 className={styles.notFoundTitle}>{t.notFoundTitle}</h1>
						<p className={styles.notFoundText}>{t.notFoundText}</p>
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
					{t.backToBlogs}
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
			</div>
		</main>
	)
}
