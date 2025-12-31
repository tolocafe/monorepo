import * as Sentry from '@sentry/react-native'

import * as posthog from './posthog'

export type AnalyticsEvent =
	// Cart events
	| 'cart:item_add'
	| 'cart:item_quantity_update'
	| 'cart:item_remove'
	// Checkout events
	| 'checkout:insufficient_balance'
	| 'checkout:start'
	// Menu events
	| 'menu:coffee_story_complete'
	// Settings events
	| 'settings:language_change'
	// Social/engagement events
	| 'social:link_click'
	| 'store:directions_click'
	| 'store:tripadvisor_click'
	// Table events
	| 'table:payment_start'
	// Wallet events
	| 'wallet:amount_select'
	| 'wallet:pass_add'
	| 'wallet:topup_start'

export type EventProperties = {
	available_balance?: number
	bill_total?: number
	// Cart/order properties
	cart_total?: number
	// Menu properties
	category_id?: string
	category_name?: string
	// Coffee story properties
	coffee_id?: string
	coffee_name?: string
	// Common properties
	currency?: string
	// Wallet properties
	current_balance?: number
	event_id?: string
	// Profile properties
	fields_updated?: string[]
	// Auth properties
	has_item_context?: boolean
	has_modifications?: boolean
	item_category?: string
	item_count?: number
	item_id?: string
	item_name?: string
	// Social properties
	map_provider?: string
	// Modification properties
	modification_group?: string
	modification_id?: string
	new_locale?: string
	new_quantity?: number
	// Settings properties
	old_locale?: string
	old_quantity?: number
	order_count?: number
	// Order properties
	order_id?: string
	order_status?: string
	payment_method?: string
	platform?: string
	price?: string
	product_id?: string
	product_name?: string
	product_price?: number
	// Promotion properties
	promotion_id?: string
	quantity?: string
	required_amount?: number
	selected_amount?: number
	session_count?: number
	// Table properties
	table_id?: string
	topup_amount?: number
	// Transaction properties
	transaction_id?: string
	transaction_name?: string
}

export type UserIdentity = {
	birthdate?: string
	email?: string
	firstName?: string
	lastName?: string
	phoneNumber?: string
	userId?: string
}

export async function flush() {
	try {
		await Promise.allSettled([posthog.flush(), Promise.resolve(Sentry.flush())])
	} catch (error) {
		Sentry.captureException(error)
	}
}

export async function identify(identity: UserIdentity) {
	const { birthdate, email, firstName, lastName, phoneNumber, userId } =
		identity

	try {
		if (userId) {
			const properties: Record<string, string> = {}
			if (birthdate) properties.birthday = birthdate
			if (email) properties.email = email
			if (firstName) properties.first_name = firstName
			if (lastName) properties.last_name = lastName
			if (phoneNumber) properties.phone = phoneNumber

			posthog.identify(userId, properties)
		}

		Sentry.setUser({
			email: email ?? undefined,
			id: userId ?? undefined,
			username: firstName
				? `${firstName}${lastName ? ` ${lastName}` : ''}`
				: undefined,
		})
	} catch (error) {
		Sentry.captureException(error)
	}
}

export function reset() {
	try {
		posthog.reset()
		Sentry.setUser(null)
	} catch (error) {
		Sentry.captureException(error)
	}
}

export function trackEvent(
	event: AnalyticsEvent,
	properties?: EventProperties,
) {
	try {
		posthog.capture(event, properties ?? {})
	} catch (error) {
		Sentry.captureException(error)
	}
}
