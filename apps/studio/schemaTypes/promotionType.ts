import { BoltIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

import { baseLanguage } from './localeStringType'

/**
 * Promotion document type for special offers and campaigns
 * with field-level translations for name, excerpt, and body
 */
export const promotionType = defineType({
	fields: [
		defineField({
			description: 'ID in Poster',
			name: 'posterId',
			title: 'Poster ID',
			type: 'string',
			validation: (rule) =>
				rule.required().custom(async (value, context) => {
					if (!value) return true
					const { document, getClient } = context
					const client = getClient({ apiVersion: '2024-01-01' })
					const id = document?._id?.replace(/^drafts\./, '')
					const params = { id, posterId: value }
					const query = `count(*[_type == "promotion" && posterId == $posterId && !(_id in [$id, "drafts." + $id])])`
					const count = await client.fetch(query, params)
					return count === 0 || 'This Poster ID is already in use'
				}),
		}),
		defineField({
			name: 'name',
			title: 'Name',
			type: 'localeString',
			validation: (rule) => rule.required(),
		}),
		defineField({
			description: 'URL-friendly identifier for each language',
			name: 'slug',
			title: 'Slug',
			type: 'localeSlug',
			validation: (rule) => rule.required(),
		}),
		defineField({
			description: 'A short summary of the promotion for previews',
			name: 'excerpt',
			title: 'Excerpt',
			type: 'localeText',
		}),
		defineField({
			description: 'Full promotion details',
			name: 'body',
			title: 'Body',
			type: 'localeBlockContent',
		}),
		defineField({
			name: 'images',
			of: [
				{
					fields: [
						defineField({
							description: 'Important for accessibility and SEO',
							name: 'alt',
							title: 'Alternative text',
							type: 'localeString',
						}),
					],
					options: {
						hotspot: true,
					},
					type: 'image',
				},
			],
			title: 'Images',
			type: 'array',
		}),
	],
	icon: BoltIcon,
	name: 'promotion',
	orderings: [
		{
			by: [{ direction: 'asc', field: `name.${baseLanguage?.id || 'es'}` }],
			name: 'nameAsc',
			title: 'Name A-Z',
		},
		{
			by: [{ direction: 'desc', field: `name.${baseLanguage?.id || 'es'}` }],
			name: 'nameDesc',
			title: 'Name Z-A',
		},
	],
	preview: {
		prepare({ title, subtitle, images }) {
			return {
				media: images?.[0],
				subtitle: subtitle || '',
				title: title || 'Untitled',
			}
		},
		select: {
			images: 'images',
			subtitle: `excerpt.${baseLanguage?.id || 'es'}`,
			title: `name.${baseLanguage?.id || 'es'}`,
		},
	},
	title: 'Promotion',
	type: 'document',
})
