import { captureException } from '@sentry/cloudflare'
import type { Event } from '@tolo/common/api'
import type { SupportedLocale } from '@tolo/common/locales'
import { Hono } from 'hono'

import type { Bindings } from '~/types'
import { defaultJsonHeaders } from '~/utils/headers'
import sanity from '~/utils/sanity'

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
						// Type guard: check if img is SanityImage
						if ('asset' in img && img.asset?._ref) {
							return {
								sourceId: img.asset._ref,
							}
						}
						return null
					})
					.filter((img): img is { sourceId: string } => img !== null)

				return {
					dates: event.startDate ? [event.startDate] : null,
					description: event.excerpt,
					id: event._id,
					images,
					location: null, // Location is a reference, would need separate query
					name: event.name || '',
					slug: event.slug?.current || '',
					summary: event.excerpt,
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
			const event = await sanity.getEvent(context.env, id, language)

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
					if (!img.sourceId) return null
					return {
						sourceId: img.sourceId,
					}
				})
				.filter((img): img is { sourceId: string } => img !== null)

			const localized: Event = {
				dates: event.startDate ? [event.startDate] : null,
				description: event.body ?? event.excerpt,
				id: event._id,
				images,
				location: null, // Location is a reference, would need separate query
				name: event.name || '',
				slug: event.slug?.current || '',
				summary: event.excerpt,
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
