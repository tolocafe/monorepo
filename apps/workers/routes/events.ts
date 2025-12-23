import { Hono } from 'hono'

import sanity, {
	getLocalizedSlug,
	getLocalizedString,
} from '~workers/utils/sanity'

import type { SupportedLocale } from '~common/locales'

import { defaultJsonHeaders } from '../utils/headers'

import type { Bindings } from '../types'

const events = new Hono<{ Bindings: Bindings }>()
	.get('/', async (context) => {
		const language = context.get('language') as SupportedLocale

		try {
			const sanityEvents = await sanity.listEvents(context.env)

			const localized = sanityEvents.map((event) => {
				const imageUrl = event.image
					? `https://cdn.sanity.io/images/${context.env.SANITY_PROJECT_ID}/${context.env.SANITY_DATASET}/${event.image.asset._ref.replace('image-', '').replace(/-([a-z]+)$/, '.$1')}`
					: undefined

				return {
					dates: event.dates,
					description: getLocalizedString(event.description, language),
					image: imageUrl ? { url: imageUrl } : undefined,
					location: getLocalizedString(event.location, language),
					name: getLocalizedString(event.name, language) || '',
					slug: getLocalizedSlug(event.slug, language) || '',
					summary: getLocalizedString(event.summary, language),
				}
			})

			return context.json(localized, 200, defaultJsonHeaders)
		} catch {
			return context.json(
				{ error: 'Failed to fetch events' },
				500,
				defaultJsonHeaders,
			)
		}
	})
	.get('/:id', async (context) => {
		const language = context.get('language') as SupportedLocale
		const event = await sanity.getEvent(context.env, context.req.param('id'))

		const imageUrl = event.image
			? `https://cdn.sanity.io/images/${context.env.SANITY_PROJECT_ID}/${context.env.SANITY_DATASET}/${event.image.asset._ref.replace('image-', '').replace(/-([a-z]+)$/, '.$1')}`
			: undefined

		const localized = {
			dates: event.dates,
			description: getLocalizedString(event.description, language),
			image: imageUrl ? { url: imageUrl } : undefined,
			location: getLocalizedString(event.location, language),
			name: getLocalizedString(event.name, language) || '',
			slug: getLocalizedSlug(event.slug, language) || '',
			summary: getLocalizedString(event.summary, language),
		}

		return context.json(localized, 200, defaultJsonHeaders)
	})

export default events
