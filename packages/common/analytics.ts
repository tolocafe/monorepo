export type ServerAnalyticsEvent =
	| 'add_payment_info'
	| 'add_shipping_info'
	| 'add_to_cart'
	| 'add_to_wishlist'
	| 'begin_checkout'
	| 'earn_virtual_currency'
	| 'generate_lead'
	| 'join_group'
	| 'login'
	| 'purchase'
	| 'refund'
	| 'remove_from_cart'
	| 'search'
	| 'select_content'
	| 'select_item'
	| 'select_promotion'
	| 'share'
	| 'sign_up'
	| 'spend_virtual_currency'
	| 'tutorial_begin'
	| 'tutorial_complete'
	| 'view_cart'
	| 'view_item'
	| 'view_item_list'
	| 'view_promotion'

export type ServerEventProperties = {
	[key: string]: boolean | number | string | undefined
	content_id?: string
	content_type?: string
	currency?: string
	item_category?: string
	item_id?: string
	items?: string
	price?: string
	quantity?: string
	transaction_id?: string
	value?: number
}
