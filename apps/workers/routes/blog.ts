import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'

import type { BlogPost } from '~common/api'
import type { SupportedLocale } from '~common/locales'
import type { Bindings } from '~workers/types'
import { defaultJsonHeaders } from '~workers/utils/headers'
import sanity, {
	getLocalizedBlockContent,
	getLocalizedSlug,
	getLocalizedString,
} from '~workers/utils/sanity'

type Variables = {
	language: SupportedLocale
}

const blog = new Hono<{ Bindings: Bindings; Variables: Variables }>()
	.get('/', async (context) => {
		const language = context.get('language')

		try {
			const sanityPosts = await sanity.listBlogPosts(context.env)

			const localized = sanityPosts.map((post): BlogPost => {
				// Extract asset IDs from images array
				const image = { sourceId: post.image?.asset?._ref as string }

				return {
					createdAt: post._createdAt,
					description: getLocalizedBlockContent(post.body, language)
						? JSON.stringify(getLocalizedBlockContent(post.body, language))
						: getLocalizedString(post.excerpt, language),
					id: post._id,
					image,
					name: getLocalizedString(post.name, language) || '',
					slug: getLocalizedSlug(post.slug, language) || '',
					summary: getLocalizedString(post.excerpt, language),
				}
			})

			return context.json(localized, 200, defaultJsonHeaders)
		} catch (error) {
			captureException(error)

			return context.json(
				{ error: 'Failed to fetch blog posts' },
				500,
				defaultJsonHeaders,
			)
		}
	})
	.get('/:id', async (context) => {
		const language = context.get('language')
		const id = context.req.param('id')

		if (!id) {
			return context.json(
				{ error: 'Blog post ID is required' },
				400,
				defaultJsonHeaders,
			)
		}

		try {
			const post = await sanity.getBlogPost(context.env, id)

			if (!post) {
				return context.json(
					{ error: 'Blog post not found' },
					404,
					defaultJsonHeaders,
				)
			}

			// Extract asset IDs from images array
			const image = { sourceId: post.image?.asset?._ref as string }

			const bodyContent = getLocalizedBlockContent(post.body, language)
			const localized: BlogPost = {
				createdAt: post._createdAt,
				description: bodyContent
					? JSON.stringify(bodyContent)
					: getLocalizedString(post.excerpt, language),
				id: post._id,
				image,
				name: getLocalizedString(post.name, language) || '',
				slug: getLocalizedSlug(post.slug, language) || '',
				summary: getLocalizedString(post.excerpt, language),
			}

			return context.json(localized, 200, {
				...defaultJsonHeaders,
				'Content-Language': language,
			})
		} catch (error) {
			captureException(error)

			return context.json(
				{ error: 'Failed to fetch blog post details' },
				500,
				defaultJsonHeaders,
			)
		}
	})

export default blog
