import { TrolleyIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

import { baseLanguage } from './localeStringType'

/**
 * Store Product document type for Shopify products
 * with field-level translations for name, excerpt, and description
 *
 * Links to Shopify via handle for pricing/availability/variants
 * while providing localized content and custom images from Sanity
 */
export const storeProductType = defineType({
	fields: [
		defineField({
			description: 'The Shopify product handle (URL slug) to link this product',
			name: 'shopifyHandle',
			title: 'Shopify Handle',
			type: 'string',
			validation: (rule) =>
				rule.required().custom(async (value, context) => {
					if (!value) return true
					const { document, getClient } = context
					const client = getClient({ apiVersion: '2024-01-01' })
					const id = document?._id?.replace(/^drafts\./, '')
					const params = { handle: value, id }
					const query = `count(*[_type == "storeProduct" && shopifyHandle == $handle && !(_id in [$id, "drafts." + $id])])`
					const count = await client.fetch(query, params)
					return count === 0 || 'This Shopify handle is already in use'
				}),
		}),
		defineField({
			description: 'Localized product name (overrides Shopify title)',
			name: 'name',
			title: 'Name',
			type: 'localeString',
		}),
		defineField({
			description: 'A short summary for product cards and previews',
			name: 'excerpt',
			title: 'Short Description',
			type: 'localeText',
		}),
		defineField({
			description: 'Full product description with rich text',
			name: 'body',
			title: 'Description',
			type: 'localeBlockContent',
		}),
		defineField({
			description:
				'Custom images from Sanity (if empty, Shopify images will be used)',
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
			description: 'Product category for filtering and organization',
			name: 'category',
			options: {
				list: [
					{ title: 'Coffee Beans', value: 'beans' },
					{ title: 'Equipment', value: 'equipment' },
					{ title: 'Accessories', value: 'accessories' },
					{ title: 'Merchandise', value: 'merchandise' },
					{ title: 'Gift Cards', value: 'gift-cards' },
				],
			},
			title: 'Category',
			type: 'string',
		}),
		defineField({
			description: 'Optional label to highlight the product',
			name: 'badge',
			options: {
				list: [
					{ title: 'New', value: 'new' },
					{ title: 'Bestseller', value: 'bestseller' },
					{ title: 'Limited', value: 'limited' },
					{ title: 'Sale', value: 'sale' },
				],
			},
			title: 'Badge',
			type: 'string',
		}),
		defineField({
			description: 'Order in which products appear (lower = first)',
			initialValue: 0,
			name: 'sortOrder',
			title: 'Sort Order',
			type: 'number',
		}),
		defineField({
			description: 'Whether to show this product in the store',
			initialValue: true,
			name: 'isVisible',
			title: 'Visible in Store',
			type: 'boolean',
		}),
	],
	icon: TrolleyIcon,
	name: 'storeProduct',
	orderings: [
		{
			by: [{ direction: 'asc', field: 'sortOrder' }],
			name: 'sortOrderAsc',
			title: 'Sort Order',
		},
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
		prepare({ title, handle, category, media }) {
			const categoryLabel =
				{
					accessories: 'Accessories',
					beans: 'Coffee Beans',
					equipment: 'Equipment',
					'gift-cards': 'Gift Cards',
					merchandise: 'Merchandise',
				}[category as string] || category
			return {
				media,
				subtitle: [handle, categoryLabel].filter(Boolean).join(' • '),
				title: title || handle || 'Untitled Product',
			}
		},
		select: {
			category: 'category',
			handle: 'shopifyHandle',
			media: 'images.0',
			title: `name.${baseLanguage?.id || 'es'}`,
		},
	},
	title: 'Store Product',
	type: 'document',
})
