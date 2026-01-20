import { queryOptions } from '@tanstack/react-query'

import { queryClient } from '~/lib/query-client'
import { api } from '~/lib/services/api-service'

// TODO: Add Blog type to lib/api when backend API is ready
export type BlogPost = {
	createdAt: string
	description?: string
	id: string
	image?: { sourceId: string }
	name: string
	slug: string
	summary?: string
}

export const blogPostsQueryOptions = queryOptions({
	placeholderData: [],
	queryFn: api.blog.getBlogPosts,
	queryKey: ['posts'] as const,
})

export const blogPostQueryOptions = (id: string) =>
	queryOptions({
		enabled: Boolean(id),
		placeholderData: () => {
			const post = queryClient
				.getQueryData<Partial<BlogPost[]>>(blogPostsQueryOptions.queryKey)
				?.find((post) => post?.id === id)

			return post
		},
		queryFn: () => api.blog.getBlogPost(id),
		queryKey: ['posts', id] as const,
	})
