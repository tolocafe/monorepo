export type AnalyticsEvent =
	| 'add_payment_info'
	| 'add_to_cart'
	| 'begin_checkout'
	| 'generate_lead'
	| 'login'
	| 'purchase'
	| 'signup'
	| 'view_cart'
	| 'view_item'

export type EventProperties = {
	currency?: string
	item_category?: string
	item_id?: string
	price?: string
	quantity?: string
	transaction_id?: string
	transaction_name?: string
}
