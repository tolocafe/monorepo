import { ComposeIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

import { baseLanguage } from './localeStringType'

/**
 * Post document type with field-level translations
 * for title, excerpt, and body content
 */
export const postType = defineType({
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'localeString',
			validation: (rule) => rule.required(),
		}),
		defineField({
			description: 'URL-friendly identifier for each language (improves SEO)',
			name: 'slug',
			title: 'Slug',
			type: 'localeSlug',
			validation: (rule) => rule.required(),
		}),
		defineField({
			initialValue: () => new Date().toISOString(),
			name: 'publishedAt',
			title: 'Published at',
			type: 'datetime',
			validation: (rule) => rule.required(),
		}),
		defineField({
			description: 'A short summary of the post for previews',
			name: 'excerpt',
			title: 'Excerpt',
			type: 'localeText',
		}),
		defineField({
			fields: [
				defineField({
					description: 'Important for accessibility and SEO',
					name: 'alt',
					title: 'Alternative text',
					type: 'localeString',
				}),
			],
			name: 'image',
			options: {
				hotspot: true,
			},
			title: 'Main image',
			type: 'image',
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'localeBlockContent',
		}),
	],
	icon: ComposeIcon,
	name: 'post',
	orderings: [
		{
			by: [{ direction: 'desc', field: 'publishedAt' }],
			name: 'publishedAtDesc',
			title: 'Published Date, New',
		},
		{
			by: [{ direction: 'asc', field: 'publishedAt' }],
			name: 'publishedAtAsc',
			title: 'Published Date, Old',
		},
	],
	preview: {
		prepare({ title, subtitle, media }) {
			return {
				media,
				subtitle: subtitle
					? new Date(subtitle).toLocaleDateString('es-MX')
					: 'No date',
				title: title || 'Untitled',
			}
		},
		select: {
			media: 'image',
			subtitle: 'publishedAt',
			title: `name.${baseLanguage?.id || 'es'}`,
		},
	},
	title: 'Post',
	type: 'document',
})
