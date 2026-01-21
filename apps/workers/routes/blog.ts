import type { BlogPost } from '@tolo/common/api'
import type { SupportedLocale } from '@tolo/common/locales'
import { Hono } from 'hono'

import type { Bindings } from '@/types'
import { defaultJsonHeaders } from '@/utils/headers'
import sanity from '@/utils/sanity'

type Variables = {
	language: SupportedLocale
}

const blog = new Hono<{ Bindings: Bindings; Variables: Variables }>()
	.get('/', async (context) => {
		try {
			const language = context.get('language')

			const sanityPosts = await sanity.listBlogPosts(context.env, language)

			const localized = sanityPosts.map((post): BlogPost => {
				// Extract asset IDs from images array
				const image = { sourceId: post.image?.asset?._ref as string }

				return {
					createdAt: post._createdAt,
					description: post.body ?? post.excerpt,
					id: post._id,
					image,
					name: post.name || '',
					slug: post.slug?.current || '',
					summary: post.excerpt,
				}
			})

			return context.json(localized, 200, defaultJsonHeaders)
		} catch (error) {
			throw new HTTPException(500, {
				cause: error,
				message: 'Could not fetch blog posts',
			})
		}
	})
	.get('/:id', async (context) => {
		try {
			const language = context.get('language')
			const id = context.req.param('id')

			if (!id) {
				return context.json(
					{ error: 'Blog post ID is required' },
					400,
					defaultJsonHeaders,
				)
			}

			const post = await sanity.getBlogPost(context.env, id, language)

			if (!post) {
				return context.json(
					{ error: 'Blog post not found' },
					404,
					defaultJsonHeaders,
				)
			}

			// Extract asset IDs from images array
			const image = { sourceId: post.image?.asset?._ref as string }

			const localized: BlogPost = {
				createdAt: post._createdAt,
				description: post.body ?? post.excerpt,
				id: post._id,
				image,
				name: post.name || '',
				slug: post.slug?.current || '',
				summary: post.excerpt,
			}

			return context.json(localized, 200, {
				...defaultJsonHeaders,
				'Content-Language': language,
			})
		} catch (error) {
			throw new HTTPException(500, {
				cause: error,
				message: 'Could not fetch blog post',
			})
		}
	})

export default blog
