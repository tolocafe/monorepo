import { PostHog } from 'posthog-node'

import { getConnInfo } from 'hono/cloudflare-workers'
import { captureException, getCurrentScope } from '@sentry/cloudflare'

import type { Context } from 'hono'

import type { Bindings } from '~workers/types'

export type PostHogEventProperties = {
	[key: string]: unknown
	amount?: number
	bill_total?: number
	cart_total?: number
	currency?: string
	is_guest?: boolean
	item_count?: number
	order_id?: number | string
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

type TrackEventOptions = {
	distinctId: string
	event: string
	properties?: Parameters<
		ReturnType<typeof createPostHogClient>['capture']
	>[0]['properties']
	userProperties?: PostHogUserProperties
}

export type BatchEventOptions = {
	distinctId: string
	event: string
	properties?: PostHogEventProperties
	/** User properties to set via $set */
	userProperties?: PostHogUserProperties
}

/**
 * Track a PostHog event from the backend
 */
export async function trackEvent(
	context: Context<{ Bindings: Bindings }>,
	{ distinctId, event, properties = {}, userProperties }: TrackEventOptions,
) {
	const posthog = createPostHogClient(context.env.POSTHOG_API_KEY)

	try {
		posthog.capture({
			distinctId,
			event,
			properties: {
				...properties,
				$pathname: context.req.path,
				$ip: getConnInfo(context).remote.address,
				$user_agent: context.req.header('User-Agent'),
				$host: context.req.header('Host'),
			},
		})

		// Update person properties if provided
		if (userProperties && Object.keys(userProperties).length > 0) {
			posthog.identify({
				distinctId,
				properties: {
					...userProperties,
					$pathname: context.req.path,
				},
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

/**
 * Track multiple PostHog events in a single batch request
 *
 * This is more efficient than calling trackEvent multiple times,
 * as it uses a single HTTP request for all events.
 *
 */
export async function trackEventsBatch(
	env: Bindings,
	events: BatchEventOptions[],
): Promise<void> {
	if (events.length === 0) return

	const posthog = createPostHogClient(env.POSTHOG_API_KEY)

	try {
		// Capture all events (PostHog client batches internally)
		for (const event of events) {
			posthog.capture({
				distinctId: event.distinctId,
				event: event.event,
				properties: {
					...event.properties,
					source: 'scheduled_worker',
					// Include $set for user properties if provided
					...(event.userProperties ? { $set: event.userProperties } : {}),
				},
			})
		}

		getCurrentScope().setExtra('PostHog Batch', {
			count: events.length,
			events: events.map((e) => e.event),
		})

		// Single shutdown flushes all captured events
		await posthog.shutdown()
	} catch (error) {
		captureException(error)
	}
}
