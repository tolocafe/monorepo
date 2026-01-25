import { DocumentIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

import { baseLanguage } from './localeStringType'

/**
 * Page document type for template pages (contact, about, legal, etc.)
 * Reusable structure with localized title, description, and body
 */
export const pageType = defineType({
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'localeString',
			validation: (rule) => rule.required(),
		}),
		defineField({
			description: 'Localized URL paths for SEO (e.g., "contacto" / "contact")',
			name: 'slug',
			title: 'Slug',
			type: 'localeSlug',
			validation: (rule) => rule.required(),
		}),
		defineField({
			description: 'Brief excerpt for SEO and page previews',
			name: 'excerpt',
			title: 'Excerpt',
			type: 'localeString',
			validation: (rule) => rule.max(200),
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'localeBlockContent',
		}),
		defineField({
			description: 'Display this page in the site navigation',
			initialValue: false,
			name: 'showInNavigation',
			title: 'Show in Navigation',
			type: 'boolean',
		}),
		defineField({
			description: 'Order in navigation menu (lower = first)',
			hidden: ({ document }) => !document?.showInNavigation,
			name: 'navigationOrder',
			title: 'Navigation Order',
			type: 'number',
		}),
	],
	icon: DocumentIcon,
	name: 'page',
	orderings: [
		{
			by: [{ direction: 'asc', field: `name.${baseLanguage?.id || 'es'}` }],
			name: 'nameAsc',
			title: 'Name',
		},
		{
			by: [{ direction: 'asc', field: 'navigationOrder' }],
			name: 'navOrder',
			title: 'Navigation Order',
		},
	],
	preview: {
		prepare({ title, slugEs, slugEn }) {
			const slug = slugEs || slugEn
			return {
				subtitle: slug ? `/${slug}` : 'No slug',
				title: title || 'Untitled',
			}
		},
		select: {
			slugEn: 'slug.en.current',
			slugEs: 'slug.es.current',
			title: `name.${baseLanguage?.id || 'es'}`,
		},
	},
	title: 'Page',
	type: 'document',
})
