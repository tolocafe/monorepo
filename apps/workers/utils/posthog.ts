import { PostHog } from 'posthog-node'

import { captureException, getCurrentScope } from '@sentry/cloudflare'

import type { Context } from 'hono'

import type { Bindings } from '../types'

export type PostHogEventProperties = {
	[key: string]: unknown
	amount?: number
	bill_total?: number
	cart_total?: number
	currency?: string
	is_guest?: boolean
	item_count?: number
	order_id?: number | string
	order_total?: number
	payment_method?: string
	platform?: string
	products?: {
		price?: number
		product_id: string
		quantity?: number
	}[]
	table_id?: string
	topup_amount?: number
	transaction_id?: string
}

export type PostHogUserProperties = {
	birthday?: string
	client_group_id?: number | string
	client_group_name?: string
	created_at?: string
	email?: string
	first_name?: string
	is_team_member?: boolean
	last_name?: string
	loyalty_points?: number
	name?: string
	order_count?: number
	phone?: string
	total_spent?: number
	wallet_balance?: number
}

/**
 * Create a PostHog client configured for serverless environments
 */
export function createPostHogClient(apiKey: string) {
	return new PostHog(apiKey, {
		flushAt: 1, // Flush immediately for serverless
		flushInterval: 0,
		host: 'https://a.tolo.cafe', // Reverse proxy
	})
}

/**
 * Identify a user with their properties in PostHog
 */
export async function identifyPostHogUser(
	context: Context<{ Bindings: Bindings }>,
	distinctId: string,
	properties: PostHogUserProperties,
) {
	const posthog = createPostHogClient(context.env.POSTHOG_API_KEY)

	try {
		posthog.identify({
			distinctId,
			properties,
		})

		getCurrentScope().setExtra('PostHog Identify', { distinctId, properties })

		await posthog.shutdown()
	} catch (error) {
		captureException(error)
	}
}

/**
 * Track a PostHog event from the backend
 */
export async function trackEvent(
	context: Context<{ Bindings: Bindings }>,
	{
		distinctId,
		event,
		properties = {},
		userProperties,
	}: {
		distinctId: string
		event: string
		properties?: PostHogEventProperties
		userProperties?: PostHogUserProperties
	},
) {
	const posthog = createPostHogClient(context.env.POSTHOG_API_KEY)

	try {
		// Capture event
		posthog.capture({
			distinctId,
			event,
			properties: {
				...properties,
				$ip: context.req.header('CF-Connecting-IP'),
			},
		})

		// Update person properties if provided
		if (userProperties && Object.keys(userProperties).length > 0) {
			posthog.identify({
				distinctId,
				properties: userProperties,
			})
		}

		getCurrentScope().setExtra('PostHog Event', {
			distinctId,
			event,
			properties,
		})

		await posthog.shutdown()
	} catch (error) {
		captureException(error)
	}
}
