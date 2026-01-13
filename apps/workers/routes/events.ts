import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'

import type { Event } from '~common/api'
import type { SupportedLocale } from '~common/locales'
import type { Bindings } from '~workers/types'
import { defaultJsonHeaders } from '~workers/utils/headers'
import sanity, {
	getLocalizedBlockContent,
	getLocalizedSlug,
	getLocalizedString,
} from '~workers/utils/sanity'

type Variables = {
	language: SupportedLocale
}

const events = new Hono<{ Bindings: Bindings; Variables: Variables }>()
	.get('/', async (context) => {
		const language = context.get('language')

		try {
			const sanityEvents = await sanity.listEvents(context.env, language)

			const localized = sanityEvents.map((event): Event => {
				// Extract asset IDs from images array
				const images = event.images
					?.map((img) => {
						if (!img.asset?._ref) return null
						return {
							sourceId: img.asset._ref,
						}
					})
					.filter((img): img is { sourceId: string } => img !== null)

				return {
					dates: event.startDate ? [event.startDate] : null,
					description: getLocalizedString(event.excerpt, language),
					id: event._id,
					images,
					location: null, // Location is a reference, would need separate query
					name: getLocalizedString(event.name, language) || '',
					slug: getLocalizedSlug(event.slug, language) || '',
					summary: getLocalizedString(event.excerpt, language),
				}
			})

			return context.json(localized, 200, defaultJsonHeaders)
		} catch (error) {
			captureException(error)

			return context.json(
				{ error: 'Failed to fetch events' },
				500,
				defaultJsonHeaders,
			)
		}
	})
	.get('/:id', async (context) => {
		const language = context.get('language')
		const id = context.req.param('id')

		if (!id) {
			return context.json(
				{ error: 'Event ID is required' },
				400,
				defaultJsonHeaders,
			)
		}

		try {
			const event = await sanity.getEvent(context.env, id)

			if (!event) {
				return context.json(
					{ error: 'Event not found' },
					404,
					defaultJsonHeaders,
				)
			}

			// Extract asset IDs from images array
			const images = event.images
				?.map((img) => {
					if (!img.asset?._ref) return null
					return {
						sourceId: img.asset._ref,
					}
				})
				.filter((img): img is { sourceId: string } => img !== null)

			const bodyContent = getLocalizedBlockContent(event.body, language)
			const localized: Event = {
				dates: event.startDate ? [event.startDate] : null,
				description: bodyContent
					? JSON.stringify(bodyContent)
					: getLocalizedString(event.excerpt, language),
				id: event._id,
				images,
				location: null, // Location is a reference, would need separate query
				name: getLocalizedString(event.name, language) || '',
				slug: getLocalizedSlug(event.slug, language) || '',
				summary: getLocalizedString(event.excerpt, language),
			}

			return context.json(localized, 200, {
				...defaultJsonHeaders,
				'Content-Language': language,
			})
		} catch (error) {
			captureException(error)

			return context.json(
				{ error: 'Failed to fetch event details' },
				500,
				defaultJsonHeaders,
			)
		}
	})

export default events
