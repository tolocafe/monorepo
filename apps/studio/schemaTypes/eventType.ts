import { CalendarIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

import { baseLanguage } from './localeStringType'

/**
 * Event document type for community events, workshops, and special occasions
 * with field-level translations for name, excerpt, and body
 */
export const eventType = defineType({
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
			description: 'A short summary of the event for previews and cards',
			name: 'excerpt',
			title: 'Excerpt',
			type: 'localeText',
			validation: (rule) => rule.max(200),
		}),
		defineField({
			description: 'Full event description with details',
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
			name: 'startDate',
			title: 'Start Date',
			type: 'datetime',
			validation: (rule) => rule.required(),
		}),
		defineField({
			description: 'Optional end date for multi-day events',
			name: 'endDate',
			title: 'End Date',
			type: 'datetime',
		}),
		defineField({
			description: 'Reference to a location document',
			name: 'location',
			title: 'Location',
			to: [{ type: 'location' }],
			type: 'reference',
		}),
		defineField({
			description: 'Optional maximum number of attendees',
			name: 'maxAttendees',
			title: 'Maximum Attendees',
			type: 'number',
			validation: (rule) => rule.min(1).integer(),
		}),
		defineField({
			description: 'External link for event registration',
			name: 'registrationUrl',
			title: 'Registration URL',
			type: 'url',
		}),
		defineField({
			description: 'Display this event prominently',
			initialValue: false,
			name: 'isFeatured',
			title: 'Featured Event',
			type: 'boolean',
		}),
		defineField({
			initialValue: 'upcoming',
			name: 'status',
			options: {
				list: [
					{ title: 'Upcoming', value: 'upcoming' },
					{ title: 'Ongoing', value: 'ongoing' },
					{ title: 'Completed', value: 'completed' },
					{ title: 'Cancelled', value: 'cancelled' },
				],
			},
			title: 'Status',
			type: 'string',
			validation: (rule) => rule.required(),
		}),
	],
	icon: CalendarIcon,
	name: 'event',
	orderings: [
		{
			by: [{ direction: 'desc', field: 'startDate' }],
			name: 'startDateDesc',
			title: 'Start Date (Newest)',
		},
		{
			by: [{ direction: 'asc', field: 'startDate' }],
			name: 'startDateAsc',
			title: 'Start Date (Oldest)',
		},
		{
			by: [{ direction: 'asc', field: `name.${baseLanguage?.id || 'es'}` }],
			name: 'nameAsc',
			title: 'Name A-Z',
		},
	],
	preview: {
		prepare({ title, subtitle, media, status }) {
			const date = subtitle
				? new Date(subtitle).toLocaleDateString('es-MX')
				: 'No date'
			const statusEmojiMap: Record<string, string> = {
				cancelled: '❌',
				completed: '✅',
				ongoing: '🔴',
				upcoming: '📅',
			}
			const statusEmoji = statusEmojiMap[status || 'upcoming'] || '📅'

			return {
				media,
				subtitle: `${statusEmoji} ${date}`,
				title: title || 'Untitled Event',
			}
		},
		select: {
			media: 'images.0',
			status: 'status',
			subtitle: 'startDate',
			title: `name.${baseLanguage?.id || 'es'}`,
		},
	},
	title: 'Event',
	type: 'document',
})
