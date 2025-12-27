/**
 * PostHog-compliant event names using category:object_action convention
 * Frontend events focus on user interactions and intents
 */
export type AnalyticsEvent =
	// Cart events
	| 'add_payment_info'
	| 'add_to_cart'
	| 'auth:phone_submit'
	| 'auth:signin_screen_view'
	// Checkout events
	| 'auth:signup_form_view'
	| 'begin_checkout'
	// Menu events
	| 'cart:item_add'
	| 'cart:item_quantity_update'
	| 'cart:item_remove'
	| 'cart:view'
	| 'checkout:insufficient_balance'
	| 'checkout:start'
	| 'generate_lead'
	// Orders events
	| 'login'
	| 'menu:category_view'
	| 'menu:coffee_story_complete'
	// Profile events
	| 'menu:coffee_view'
	| 'menu:home_view'
	// Auth events (frontend only - screen views)
	| 'menu:product_customize'
	| 'menu:product_view'
	| 'menu:promotion_view'
	// Settings events
	| 'orders:detail_view'
	| 'orders:history_view'
	// Social/engagement events
	| 'orders:receipt_download'
	| 'profile:update'
	| 'profile:view'
	| 'purchase'
	// Wallet events
	| 'sessions:view'
	| 'settings:language_change'
	| 'signup'
	| 'social:link_click'
	// Table events
	| 'store:directions_click'
	| 'store:tripadvisor_click'
	// Legacy Firebase events (keep for backward compatibility)
	| 'store:visit_us_view'
	| 'table:bill_view'
	| 'table:order_start'
	| 'table:payment_start'
	// Order payment events
	| 'order:payment_start'
	// Dine-in checkout events
	| 'checkout:dine_in_start'
	| 'view_cart'
	| 'view_item'
	| 'wallet:amount_select'
	| 'wallet:pass_add'
	| 'wallet:screen_view'
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
