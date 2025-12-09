export const BASE_URL = process.env.EXPO_PUBLIC_API_URL
export const POSTER_BASE_URL = process.env.EXPO_PUBLIC_POSTER_API_URL
export const WEBFLOW_BASE_URL = process.env.EXPO_PUBLIC_WEBFLOW_API_URL

export type Category = {
	category_color: string
	category_hidden: string
	category_id: string
	category_name: string
	category_photo: null | string
	category_photo_origin: null | string
	category_tag: null | string
	fiscal: string
	left: string
	level: string
	nodiscount: string
	parent_category: string
	right: string
	sort_order: string
	tax_id: string
	visible: {
		spot_id: number
		visible: number
	}[]
}

export type ClientAddress = {
	address1: string
	address2: string
	city: string
	comment: string
	country: string
	delivery_zone_id: number
	id: number
	lat: string
	lng: string
	sort_order: number
	zip_code: string
}

export type ClientData = {
	address?: string
	addresses?: ClientAddress[]
	birthday?: string
	birthday_bonus?: string
	bonus?: string
	card_number?: string
	city?: string
	client_groups_discount?: string
	client_groups_id?: string
	client_groups_name?: string
	client_id: string
	client_sex?: string
	comment?: string
	country?: string
	date_activale?: string
	// Additional Poster client fields returned by API (kept optional)
	discount_per?: string
	email?: string
	/** String in cents, e.g. "500" -> $5.00 */
	ewallet?: string
	/** Poster fields for granular name support */
	firstname: string
	government_id?: null | string
	lastname: string
	loyalty_type?: string
	/** Optional combined name if available */
	name?: string
	patronymic?: string
	phone: string
	/** E.g. 527224067201 */
	phone_number?: string
	total_payed_sum?: string
}

export type Coffee = {
	altitude?: number
	name: string
	origin: string
	process: string
	region: string
	/* Region or producer image */
	'region-image'?: WebflowImage
	slug: string
	/* comma separated list of tasting notes */
	'tasting-notes'?: string
	varietal: string
	/* Varietal or process image */
	'varietal-image'?: WebflowImage
}

/**
 * Transaction data from Poster API v3 dash.getTransactions
 *
 * Returns comprehensive transaction data including order details, payment information,
 * products, client data, and transaction status for tracking the complete order lifecycle.
 *
 * @see https://dev.joinposter.com/en/docs/v3/web/dash/getTransactions
 */
export type DashTransaction = {
	/** Bonus points used in the transaction */
	bonus: number
	/** Client's first name */
	client_firstname?: string
	/** Client ID who made the transaction (0 if no client assigned) */
	client_id: string
	/** Client's last name */
	client_lastname?: string
	/** Comment/note for the transaction */
	comment?: string
	/** Order closing date in the "Y-m-d H:i:s" format (empty string if not closed) */
	date_close: string
	/** Order creation date and time in "Y-m-d H:i:s" format (e.g., "2023-12-25 14:30:00") */
	date_create: string
	/** Date when order was started/opened in "Y-m-d H:i:s" format */
	date_start: string
	/** Discount amount applied to the transaction */
	discount: number
	/** Guest count for the order */
	guests_count?: number
	/**
	 * Type of payment method used
	 * - 0: Closed without payment
	 * - 1: Payment by cash
	 * - 2: Payment by bank transfer
	 * - 3: Mixed payment (combination of methods)
	 */
	pay_type: string
	/** Amount paid using bonus points (in currency units as string) */
	payed_bonus: string
	/** Amount paid by card (in currency units as string) */
	payed_card: string
	/** Amount paid by cash (in currency units as string) */
	payed_cash: string
	/** Amount paid using certificates/vouchers (in currency units as string) */
	payed_cert: string
	/** Total amount paid, sum of payed_cash and payed_card (in currency units as string) */
	payed_sum: string
	/** Amount paid through third-party payment systems (in currency units as string) */
	payed_third_party: string
	/** Whether a fiscal receipt was printed: 0—no, 1—yes */
	print_fiscal: string
	/**
	 * Processing status of the transaction
	 * - 10: Open
	 * - 20: Preparing
	 * - 30: Ready
	 * - 40: En route
	 * - 50: Delivered
	 * - 60: Closed
	 * - 70: Deleted
	 */
	processing_status: string
	/**
	 * Array of products in the transaction
	 * Each product contains quantity, ID, and total sum
	 */
	products?: {
		/** Category ID (from dash.getTransactionProducts) */
		category_id?: string
		/** Modifications/customizations for this product (from dash.getTransactions) */
		modification?: {
			/** Modification ID */
			m: string
			/** Modification name */
			modification_name?: string
		}[]
		/** Modification name as comma-separated string (from dash.getTransactionProducts) */
		modification_name?: string
		/**
		 * Parsed modifiers array with group/category info (for barista queue)
		 * Each modifier includes name and its group/category
		 */
		modifiers?: {
			/** Modifier group/category name (e.g., "Temperatura", "Leche") */
			group: string
			/** Modifier name (e.g., "Caliente", "Avena") */
			name: string
		}[]
		/** Quantity of the product */
		num: string
		/** Product ID */
		product_id: string
		/** Product name */
		product_name?: string
		/** Total price for this product (quantity × unit price) */
		product_sum?: string
	}[]
	/**
	 * Reason for closing the bill without payment (only applicable when pay_type = 0)
	 * - 1: The customer has left
	 * - 2: On the house (complimentary)
	 * - 3: A waiter's error
	 */
	reason: string
	/** Amount after rounding (in currency units as string) */
	round_sum: string
	/**
	 * Service mode for the order
	 * - 1: At the table
	 * - 2: Takeaway
	 * - 3: Delivery
	 */
	service_mode?: string
	/** Location/spot ID where the transaction occurred */
	spot_id: string
	/**
	 * Transaction status
	 * - 0: Deleted
	 * - 1: In progress/Open
	 * - 2: Closed
	 */
	status: string
	/** Total transaction amount before payment (in currency units as string) */
	sum: string
	/** Table ID where the transaction occurred */
	table_id: string
	/** Table name */
	table_name?: string
	/** Tip amount (in currency units as string) */
	tip_sum: string
	/** Transaction comment/notes */
	transaction_comment?: string
	/** Unique transaction ID */
	transaction_id: string
	/**
	 * Transaction type
	 * - 0: Sale
	 * - 1: Return
	 */
	type?: number
	/** User ID who created/handled the transaction */
	user_id?: number
}

export type Event = {
	description?: string
	end_date?: string
	image?: { url: string }
	location?: string
	name: string
	slug: string
	start_date?: string
	summary?: string
}

/**
 * Incoming order from Poster API
 * @see https://dev.joinposter.com/en/docs/v3/web/incomingOrders/getIncomingOrders
 */
export type IncomingOrder = {
	/** Delivery address */
	address?: string
	/** Client ID */
	client_id: number
	/** Order comment/note */
	comment?: null | string
	/** Order creation date in "Y-m-d H:i:s" format */
	created_at: string
	/** Delivery time (if scheduled) */
	delivery_time?: string
	/** Client email */
	email?: string
	/** Client's first name */
	first_name?: string
	/** Incoming order ID */
	incoming_order_id: number
	/** Client's last name */
	last_name?: string
	/** Client's phone number */
	phone?: null | string
	/**
	 * Products in the order
	 */
	products: {
		/** Product count (as string with decimals e.g. "1.0000000") */
		count: string
		/** Order creation date */
		created_at: string
		/** Incoming order ID */
		incoming_order_id: number
		/** Modifications array with modification ID (m) and amount (a) */
		modification?: {
			/** Amount/quantity */
			a: number
			/** Modification ID */
			m: number
		}[]
		/** Modification ID (points to a specific modifier) */
		modificator_id: null | number
		/** Product price in cents */
		price: number
		/** Product ID */
		product_id: number
	}[]
	/**
	 * Service mode
	 * - 1: Dine-in (at the table)
	 * - 2: Takeaway
	 * - 3: Delivery
	 */
	service_mode: number
	/** Spot/location ID */
	spot_id: number
	/**
	 * Order status
	 * - 0: New
	 * - 1: Accepted
	 * - 7: Canceled
	 */
	status: number
	/** Table ID (for dine-in orders) */
	table_id?: null | number
	/** Associated transaction ID (after payment) */
	transaction_id?: number
	/** Order update date in "Y-m-d H:i:s" format */
	updated_at: string
}

export type PageInfo = {
	count: number
	page: number
	per_page: number
}

export type PosterIngredient = {
	ingredient_id: string
	ingredient_name: string
	ingredient_unit: string
	ingredient_weight: number
	ingredients_losses_bake: string
	ingredients_losses_clear: string
	ingredients_losses_cook: string
	ingredients_losses_fry: string
	ingredients_losses_stew: string
	pr_in_bake: string
	pr_in_clear: string
	pr_in_cook: string
	pr_in_fry: string
	pr_in_stew: string
	structure_brutto: number
	structure_id: string
	structure_lock: string
	structure_netto: number
	structure_selfprice: string
	structure_selfprice_netto: string
	structure_type: string
	structure_unit: string
}

export type PosterModification = {
	brutto: number
	dish_modification_id: number
	ingredient_id: number
	last_modified_time: string
	modificator_name: string
	modificator_selfprice: string
	name: string
	photo_large: string
	photo_orig: string
	photo_small: string
	price: number
	sort_order: number
	spots: {
		price: string
	}[]
	type: number
}

export type PosterModificationGroup = {
	dish_modification_group_id: number
	is_deleted: number
	modifications?: PosterModification[]
	name: string
	num_max: number
	num_min: number
	type: number
}

export type PosterResponse<ResponseShape> = {
	error?: string
	response: null | ResponseShape
}

export type Product = {
	barcode: string
	/* Caffeine level of the beverage, 0 - 5  */
	caffeine?: number
	/* Calories in kcal  */
	calories?: number
	category_name: string
	color: string
	cooking_time: string
	cost: string
	cost_netto: string
	description?: string
	different_spots_prices: string
	fiscal: string
	group_modifications?: PosterModificationGroup[]
	hidden: string
	ingredient_id: string
	ingredients?: PosterIngredient[]
	/* Strength level of the beverage, 0 - 5  */
	intensity?: number
	master_id: string
	menu_category_id: string
	modifications?: PosterModification[]
	nodiscount: string
	out: number
	photo: string
	photo_origin: null | string
	price?: Record<string, string>
	product_code: string
	product_id: string
	product_name: string
	product_production_description: string
	product_tax_id: string
	profit: Record<string, string>
	recipe?: string
	'small-description'?: string
	sort_order: string
	sources: unknown[]
	spots: {
		price: string
		profit: string
		profit_netto: string
		spot_id: string
		visible: string
	}[]
	tax_id: string
	type: string
	unit: string
	/* Volume in milliliters  */
	volume?: number
	weight_flag: string
	workshop: string
}

/**
 * Promotion data from Poster API
 * @see https://dev.joinposter.com/en/docs/v3/web/clients/getPromotions
 */
export type Promotion = {
	/** Bonus value for the promotion */
	bonus?: string
	/** End date of the promotion */
	date_end?: string
	/** Start date of the promotion */
	date_start?: string
	/** Discount percentage */
	discount_percent?: string
	/** Promotion photo URL */
	image?: { url: string }
	/** Promotion name */
	name: string
	/** Unique promotion ID */
	promotion_id: string
	/**
	 * Promotion type
	 * - 0: Manual
	 * - 1: Discount on products
	 * - 2: Discount on categories
	 * - 3: N+1 promotion
	 * - 4: Fixed bonus
	 * - 5: Percent bonus
	 * - 6: Happy hours
	 */
	promotion_type: string
	/** Status: 0=inactive, 1=active */
	status?: string
	/** Promotion summary description */
	summary?: string
}

export type TableBill = {
	items: {
		name: string
		/** Unit price in cents */
		price: number
		productId: string
		quantity: number
	}[]
	locationId: string
	subtotal: number
	tableId: string
	tableName: string
	tax: number
	total: number
	transactionId: string
}

export type UpdateClientBody = Partial<{
	birthday: string
	bonus: number
	card_number: string
	client_groups_id_client: number
	client_name: string
	client_sex: number
	discount_per: number
	email: string
	phone: string
	total_payed_sum: number
}>

export type WebflowImage = {
	alt?: string
	fileId: string
	url: string
}
