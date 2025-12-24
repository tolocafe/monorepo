import { Hono } from 'hono'

import { defaultJsonHeaders } from '~workers/utils/headers'
import sanity, {
	getLocalizedSlug,
	getLocalizedString,
} from '~workers/utils/sanity'

import type { Event } from '~common/api'
import type { SupportedLocale } from '~common/locales'
import type { Bindings } from '~workers/types'

type Variables = {
	language: SupportedLocale
}

const events = new Hono<{ Bindings: Bindings; Variables: Variables }>()
	.get('/', async (context) => {
		const language = context.get('language')

		try {
			const sanityEvents = await sanity.listEvents(context.env)

			const localized = sanityEvents.map((event): Event => {
				// Extract asset IDs from images array
				const images = event.images?.map((img) => ({
					sourceId: img.asset._ref,
				}))

				return {
					dates: event.startDate ? [event.startDate] : undefined,
					description: getLocalizedString(event.excerpt, language),
					images,
					location: undefined, // Location is a reference, would need separate query
					name: getLocalizedString(event.name, language) || '',
					slug: getLocalizedSlug(event.slug, language) || '',
					summary: getLocalizedString(event.excerpt, language),
				}
			})

			return context.json(localized, 200, defaultJsonHeaders)
		} catch (error) {
			console.error(error)

			return context.json(
				{ error: 'Failed to fetch events' },
				500,
				defaultJsonHeaders,
			)
		}
	})
	.get('/:id', async (context) => {
		const language = context.get('language')
		const event = await sanity.getEvent(context.env, context.req.param('id'))

		// Extract asset IDs from images array
		const images = event.images?.map((img) => ({
			sourceId: img.asset._ref,
		}))

		const localized = {
			dates: event.startDate ? [event.startDate] : undefined,
			description: getLocalizedString(event.excerpt, language),
			images,
			location: undefined, // Location is a reference, would need separate query
			name: getLocalizedString(event.name, language) || '',
			slug: getLocalizedSlug(event.slug, language) || '',
			summary: getLocalizedString(event.excerpt, language),
		}

		return context.json(localized, 200, defaultJsonHeaders)
	})

export default events
