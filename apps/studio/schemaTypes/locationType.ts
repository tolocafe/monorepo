import { PinIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

import { baseLanguage } from './localeStringType'

/**
 * Location document type for TOLO's physical locations
 * with field-level translations for name, description, and address
 */
export const locationType = defineType({
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
			description: 'Full description of the location',
			name: 'description',
			title: 'Description',
			type: 'localeBlockContent',
		}),
		defineField({
			description: 'Full street address',
			name: 'address',
			title: 'Address',
			type: 'localeText',
		}),
		defineField({
			name: 'city',
			title: 'City',
			type: 'string',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'state',
			title: 'State/Province',
			type: 'string',
		}),
		defineField({
			name: 'country',
			title: 'Country',
			type: 'string',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'postalCode',
			title: 'Postal Code',
			type: 'string',
		}),
		defineField({
			description: 'Geographic coordinates for map display',
			name: 'coordinates',
			title: 'Coordinates',
			type: 'geopoint',
		}),
		defineField({
			name: 'phone',
			title: 'Phone',
			type: 'string',
		}),
		defineField({
			name: 'email',
			title: 'Email',
			type: 'string',
			validation: (rule) => rule.email(),
		}),
		defineField({
			description: 'Operating hours (e.g., Mon-Fri: 8am-8pm)',
			name: 'hours',
			title: 'Hours',
			type: 'localeText',
		}),
		defineField({
			description: 'Photo of the location',
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
			title: 'Image',
			type: 'image',
		}),
		defineField({
			description: 'Mark this as the primary/flagship location',
			initialValue: false,
			name: 'isMainLocation',
			title: 'Main Location',
			type: 'boolean',
		}),
		defineField({
			description: 'Mark this location as upcoming/not yet open',
			initialValue: false,
			name: 'isUpcoming',
			title: 'Upcoming',
			type: 'boolean',
		}),
	],
	icon: PinIcon,
	name: 'location',
	orderings: [
		{
			by: [{ direction: 'asc', field: `name.${baseLanguage?.id || 'es'}` }],
			name: 'nameAsc',
			title: 'Name A-Z',
		},
		{
			by: [{ direction: 'asc', field: 'city' }],
			name: 'cityAsc',
			title: 'City',
		},
	],
	preview: {
		prepare({ title, city, media }) {
			return {
				media,
				subtitle: city || 'No city',
				title: title || 'Untitled Location',
			}
		},
		select: {
			city: 'city',
			media: 'image',
			title: `name.${baseLanguage?.id || 'es'}`,
		},
	},
	title: 'Location',
	type: 'document',
})
