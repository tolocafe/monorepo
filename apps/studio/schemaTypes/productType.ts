import { DropIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

import { baseLanguage } from './localeStringType'

/**
 * Product document type for menu items/drinks
 * with field-level translations for name, excerpt, body, and recipe
 */
export const productType = defineType({
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
					const query = `count(*[_type == "product" && posterId == $posterId && !(_id in [$id, "drafts." + $id])])`
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
			description: 'Optional label for menu items',
			name: 'tag',
			options: {
				list: [
					{ title: 'Seasonal', value: 'SEASONAL' },
					{ title: 'Favorite', value: 'FAVORITE' },
					{ title: 'New', value: 'NEW' },
					{ title: 'Special', value: 'SPECIAL' },
				],
			},
			title: 'Tag',
			type: 'string',
		}),
		defineField({
			description: 'A short summary for previews and cards',
			name: 'excerpt',
			title: 'Small Description',
			type: 'localeText',
		}),
		defineField({
			description: 'Full product description',
			name: 'body',
			title: 'Description',
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
		defineField({
			description: 'Intensity level (1-5)',
			name: 'intensity',
			title: 'Intensity',
			type: 'number',
			validation: (rule) => rule.min(1).max(5).integer(),
		}),
		defineField({
			description: 'Caffeine level (1-5)',
			name: 'caffeine',
			title: 'Caffeine',
			type: 'number',
			validation: (rule) => rule.min(1).max(5).integer(),
		}),
		defineField({
			description: 'Volume in milliliters (ml)',
			name: 'volume',
			title: 'Volume',
			type: 'number',
			validation: (rule) => rule.min(0),
		}),
		defineField({
			description: 'Calories per serving',
			name: 'calories',
			title: 'Calories',
			type: 'number',
			validation: (rule) => rule.min(0),
		}),
		defineField({
			description: 'Ingredients and preparation instructions',
			name: 'recipe',
			title: 'Recipe',
			type: 'localeBlockContent',
		}),
	],
	icon: DropIcon,
	name: 'product',
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
	title: 'Product',
	type: 'document',
})
