import { LeaveIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

import { baseLanguage } from './localeStringType'

/**
 * Bean document type for TOLO's coffee beans
 * with field-level translations for name, origin, region,
 * varietal, process, and tasting notes
 */
export const beanType = defineType({
	fields: [
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
			description: 'Country or area of origin (e.g., Ethiopia, Colombia)',
			name: 'origin',
			title: 'Origin',
			type: 'localeString',
		}),
		defineField({
			description:
				'Specific region within the origin (e.g., Yirgacheffe, Huila)',
			name: 'region',
			title: 'Region',
			type: 'localeString',
		}),
		defineField({
			description: 'Coffee farm or producer name',
			name: 'producer',
			title: 'Producer',
			type: 'localeString',
		}),
		defineField({
			description: 'Coffee variety (e.g., Bourbon, Gesha, Typica)',
			name: 'varietal',
			title: 'Varietal',
			type: 'localeString',
		}),
		defineField({
			description: 'Growing altitude in meters above sea level (MASL)',
			name: 'altitude',
			title: 'Altitude',
			type: 'number',
			validation: (rule) => rule.min(0).max(3000),
		}),
		defineField({
			description: 'Processing method (e.g., Washed, Natural, Honey)',
			name: 'process',
			title: 'Process',
			type: 'localeString',
		}),
		defineField({
			description: 'A short summary of the bean for previews',
			name: 'excerpt',
			title: 'Excerpt',
			type: 'localeText',
		}),
		defineField({
			description: 'Flavor profile and tasting notes',
			name: 'tastingNotes',
			title: 'Tasting Notes',
			type: 'localeText',
		}),
		defineField({
			description: 'Roast color measurement (0-100, lower = darker)',
			name: 'agtron',
			title: 'Agtron',
			type: 'number',
			validation: (rule) => rule.min(0).max(100),
		}),
		defineField({
			description: 'Photo of the coffee growing region',
			fields: [
				defineField({
					description: 'Important for accessibility and SEO',
					name: 'alt',
					title: 'Alternative text',
					type: 'localeString',
				}),
			],
			name: 'regionImage',
			options: {
				hotspot: true,
			},
			title: 'Region Image',
			type: 'image',
		}),
		defineField({
			description: 'Photo of the coffee varietal/cherries',
			fields: [
				defineField({
					description: 'Important for accessibility and SEO',
					name: 'alt',
					title: 'Alternative text',
					type: 'localeString',
				}),
			],
			name: 'varietalImage',
			options: {
				hotspot: true,
			},
			title: 'Varietal Image',
			type: 'image',
		}),
		defineField({
			description: 'Whether this bean is currently active/available',
			initialValue: false,
			name: 'isActive',
			title: 'Is Active',
			type: 'boolean',
		}),
	],
	icon: LeaveIcon,
	name: 'bean',
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
		{
			by: [{ direction: 'desc', field: 'altitude' }],
			name: 'altitudeDesc',
			title: 'Altitude (High to Low)',
		},
	],
	preview: {
		prepare({ title, origin, media }) {
			return {
				media,
				subtitle: origin || 'No origin',
				title: title || 'Untitled Bean',
			}
		},
		select: {
			media: 'regionImage',
			origin: `origin.${baseLanguage?.id || 'es'}`,
			title: `name.${baseLanguage?.id || 'es'}`,
		},
	},
	title: 'Bean',
	type: 'document',
})
