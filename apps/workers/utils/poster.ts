/**
 * Poster POS API Client
 *
 * This module provides a typed client for interacting with the Poster POS API.
 * Poster is a cloud-based point of sale system for restaurants, cafes, and retail.
 *
 * @see https://dev.joinposter.com/en/docs/v3/start/index - API Introduction
 * @see https://dev.joinposter.com/en/docs/v3/web/index - Web API Reference
 *
 * API Sections used:
 * - Marketing (clients): Customer management, e-Wallet, loyalty programs
 * - Reports (dash): Transaction reports and analytics
 * - Products (menu): Menu items, categories, and dishes
 * - Orders (transactions): Order management and payment processing
 * - Online Orders (incomingOrders): Online order creation and management
 * - Finance: Financial transactions and accounting
 *
 * @module poster
 */
import { PublishCommand, SNS } from '@aws-sdk/client-sns'
import { getCurrentScope } from '@sentry/cloudflare'
import type {
	Category,
	ClientData,
	DashTransaction,
	IncomingOrder,
	PosterResponse,
	Product,
	Promotion,
	UpdateClientBody,
} from '@tolo/common/api'
import type { CreateOrder } from '@tolo/common/schemas'

const snsClient = new SNS({
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
	region: 'us-east-1',
})

/** Poster API base URL */
const BASE_URL = 'https://joinposter.com/api'

const defaultGetMenuProductsOptions = { type: 'products' } as const

/**
 * Custom error class for Poster API errors
 */
class PosterError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'PosterError'
	}
}

/**
 * Filters out null/undefined values and converts all values to strings
 * @internal
 */
function getCleanedParameters(
	parameters?: Record<string, boolean | number | string | undefined>,
) {
	const filteredParameters = Object.entries(parameters ?? {}).filter(
		([_, value]) => value !== null && value !== undefined,
	)

	const stringParameters = filteredParameters.map(([key, value]) => [
		key,
		(value as boolean | number | string).toString(),
	])

	return Object.fromEntries(stringParameters) as Record<string, string>
}

/**
 * Creates URLSearchParams from a parameters object, filtering nulls
 * @internal
 */
function getSearchParameters(
	parameters?: Record<string, boolean | number | string | undefined>,
) {
	return new URLSearchParams(getCleanedParameters(parameters))
}

/**
 * Generic fetch wrapper for Poster API requests with error handling and Sentry context
 *
 * @template TResponse - Expected response data type
 * @param url - API endpoint path (will be appended to BASE_URL)
 * @param options - Fetch options with optional defaultErrorMessage
 * @returns Promise resolving to the response data
 * @throws {PosterError} When API returns an error or response is null
 */
export async function posterFetch<TResponse = unknown>(
	url: string,
	options: RequestInit & { defaultErrorMessage?: string },
) {
	const currentScope = getCurrentScope()

	currentScope.setContext('Fetch Request', {
		Body: options.body,
		Method: options.method,
		URL: `${BASE_URL}${url}`,
	})

	const data = (await fetch(`${BASE_URL}${url}`, options).then(
		(response) => response.json() as unknown,
	)) as PosterResponse<TResponse>

	currentScope.setContext('Fetch Response', { Data: data })

	if (data.response) {
		return data.response
	}

	throw new PosterError(
		data.error || options.defaultErrorMessage || 'Failed to fetch data',
	)
}

/**
 * Poster API client organized by API sections
 *
 */
export const posterApi = {
	/**
	 * Marketing - Customer Management API
	 *
	 * Methods for managing customers, loyalty programs, and e-Wallet transactions.
	 * All client methods are part of the Marketing section in Poster.
	 *
	 * @see https://dev.joinposter.com/en/docs/v3/web/clients/index
	 */
	clients: {
		/**
		 * Top up a customer's e-Wallet balance
		 *
		 * Adds funds to a customer's electronic wallet. Can be linked to a transaction
		 * and specifies the payment method (cash or card).
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/addEWalletPayment
		 */
		addEWalletPayment(
			token: string,
			body: {
				/** Amount in cents (converted to currency units) */
				amount: number
				client_id: number
				spot_id?: number
				transaction_id?: number
				/** Top up method: 1=cash, 2=card */
				type: 1 | 2
			},
		) {
			const finalBody = { ...body, amount: body.amount / 100 }

			return posterFetch<string>(`/clients.addEWalletPayment?token=${token}`, {
				body: JSON.stringify(finalBody),
				defaultErrorMessage: 'Failed to add e-wallet payment',
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			})
		},

		/**
		 * Withdraw funds from a customer's e-Wallet
		 *
		 * Deducts funds from a customer's electronic wallet balance.
		 * Typically used when customer pays for an order using e-Wallet balance.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/addEWalletTransaction
		 */
		addEWalletTransaction(
			token: string,
			body: {
				/** Amount in cents (converted to currency units) */
				amount: number
				client_id: number
			},
		) {
			const parsedBody = {
				amount: body.amount / 100,
				client_id: body.client_id,
			}

			return posterFetch<number>(
				`/clients.addEWalletTransaction?token=${token}`,
				{
					body: JSON.stringify(parsedBody),
					defaultErrorMessage: 'Failed to add e-wallet transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},

		/**
		 * Create a new customer in Poster
		 *
		 * Registers a new customer with the provided details. Phone numbers must be
		 * unique - duplicate phones will cause an error.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/createClient
		 */
		createClient(
			token: string,
			body: {
				/** Format: "Y-m-d" */
				birthday?: string
				/** Initial bonus points */
				bonus?: number
				/** Customer group ID for loyalty */
				client_groups_id_client: number
				client_name?: string
				/** 0=not specified, 1=male, 2=female */
				client_sex?: number
				email?: string
				/** Unique, international format */
				phone: string
			},
		) {
			return posterFetch<number>(`/clients.createClient?token=${token}`, {
				body: JSON.stringify(body),
				defaultErrorMessage: 'Failed to create client',
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			})
		},

		/**
		 * Find a customer by phone number
		 *
		 * Searches for a customer using their phone number. Returns the first match
		 * or null if no customer is found. Uses the getClients endpoint with phone filter.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/getClients
		 */
		getClient(token: string, phone: string) {
			return posterFetch<ClientData[]>(
				`/clients.getClients?token=${token}&phone=${encodeURIComponent(phone)}&num=1`,
				{
					defaultErrorMessage: 'Failed to get client',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
				.then((response) => response.at(0) ?? null)
				.catch(() => null)
		},

		/**
		 * Get customer properties by ID
		 *
		 * Retrieves detailed customer information using their Poster customer ID.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/getClient
		 */
		getClientById(token: string, id: number) {
			return posterFetch<ClientData[]>(
				`/clients.getClient?${new URLSearchParams({ client_id: id.toString(), token })}`,
				{
					defaultErrorMessage: 'Failed to get client',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
				.then((response) => response.at(0) ?? null)
				.catch(() => null)
		},

		/**
		 * Get a paginated list of customers
		 *
		 * Retrieves customers with pagination support. Returns customer data including:
		 * - Basic info (name, phone, email, birthday)
		 * - Loyalty data (bonus points, total purchases, discount percentage)
		 * - Group membership and e-Wallet balance
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/getClients
		 */
		getClients(
			token: string,
			{
				num: number_ = 100,
				offset = 0,
			}: { num?: number; offset?: number } = {},
		) {
			return posterFetch<ClientData[]>(
				`/clients.getClients?${new URLSearchParams({ num: number_.toString(), offset: offset.toString(), token })}`,
				{
					defaultErrorMessage: 'Failed to get clients',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
		},

		/**
		 * Get available promotions
		 *
		 * Retrieves all active promotions configured in Poster.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/getPromotions
		 */
		getPromotions(token: string) {
			return posterFetch<Promotion[]>(`/clients.getPromotions?token=${token}`, {
				defaultErrorMessage: 'Failed to get promotions',
			})
		},

		/**
		 * Update customer properties
		 *
		 * Updates an existing customer's information. Only provided fields will be updated.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/updateClient
		 */
		updateClient(token: string, clientId: number, body: UpdateClientBody) {
			return posterFetch<number>(
				`/clients.updateClient?${new URLSearchParams({ token })}`,
				{
					body: JSON.stringify({ ...body, client_id: clientId }),
					defaultErrorMessage: 'Failed to update client',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},
	},
	/**
	 * Reports - Transaction Analytics API
	 *
	 * Methods for retrieving transaction reports, sales data, and analytics.
	 * The "dash" namespace provides read-only access to transaction history.
	 *
	 * @see https://dev.joinposter.com/en/docs/v3/web/dash/index
	 */
	dash: {
		/**
		 * Get a single transaction by ID
		 *
		 * Retrieves detailed information about a specific transaction including
		 * payment amounts, taxes, tips, and optionally products and history.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/dash/getTransaction
		 */
		getTransaction(
			token: string,
			id: string,
			options?: { include_history?: 'true'; include_products?: 'true' },
		) {
			return posterFetch<
				{
					client_id: string
					payed_sum: string
					products?: {
						num: string
						product_id: string
						product_price: string
					}[]
					round_sum: string
					/** Location ID */
					spot_id: string
					sum: string
					tax_sum: string
					tip_sum: string
				}[]
			>(
				`/dash.getTransaction?${new URLSearchParams({
					token,
					transaction_id: id,
					...options,
				})}`,
				{
					defaultErrorMessage: 'Failed to get transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			).then((response) => response.at(0) ?? null)
		},

		/**
		 * Get products for a specific transaction with modification names
		 *
		 * Retrieves the list of products included in a transaction along with
		 * their modifications and quantities. Useful for generating receipts.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/dash/getTransactionProducts
		 */
		async getTransactionProducts(
			token: string,
			transactionId: string,
		): Promise<
			{
				category_id: string
				modification_id: string
				modificator_name: null | string
				num: string
				product_id: string
				product_name: string
			}[]
		> {
			const data = (await fetch(
				`${BASE_URL}/dash.getTransactionProducts?${getSearchParameters({ token, transaction_id: transactionId })}`,
			).then((response) => response.json())) as PosterResponse<
				{
					category_id: string
					modification_id: string
					modificator_name: null | string
					num: string
					product_id: string
					product_name: string
				}[]
			>

			if (data.response) return data.response

			return []
		},

		/**
		 * Get a list of transactions with filtering options
		 *
		 * Retrieves transactions with comprehensive filtering by date range, status,
		 * service mode, table, and more. Returns payment details, customer info, and
		 * optionally products and history for each transaction.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/dash/getTransactions
		 */
		getTransactions(
			token: string,
			options?: {
				/** Y-m-d format, e.g. '2023-12-01'. Default: one month ago */
				date_from?: string
				/** Y-m-d format, e.g. '2023-12-31'. Default: current date */
				date_to?: string
				/** Entity ID. Requires `type` to be set */
				id?: string
				include_history?: 'true'
				include_products?: 'true'
				/** 1=dine-in, 2=takeout, 3=delivery */
				service_mode?: '1' | '2' | '3'
				/** 0=all, 1=open, 2=closed, 3=removed */
				status?: '0' | '1' | '2' | '3'
				table_id?: string
				/** Requires `id` to be set */
				type?: 'clients' | 'spots' | 'waiters'
			},
		) {
			return posterFetch<DashTransaction[]>(
				`/dash.getTransactions?${getSearchParameters({ token, ...options })}`,
				{ defaultErrorMessage: 'Failed to get transactions' },
			)
		},
	},
	/**
	 * Finance - Financial Transactions API
	 *
	 * Methods for creating and retrieving financial transactions (income, expenses, transfers).
	 * These are accounting transactions separate from POS order transactions.
	 *
	 * Transaction types:
	 * - 0: Expenditure (money out)
	 * - 1: Income (money in)
	 * - 2: Transfer (between accounts)
	 *
	 * @see https://dev.joinposter.com/en/docs/v3/web/finance/index
	 */
	finance: {
		/**
		 * Create a new financial transaction
		 *
		 * Records an income transaction in Poster's financial system.
		 * Used for tracking revenue outside of regular POS transactions.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/finance/createTransactions
		 */
		createTransaction(
			token: string,
			body: {
				/** Account ID to credit */
				account_to: 1
				/** Amount in cents (converted to currency units) */
				amount_to: number
				/** Financial category ID */
				category: number
				comment?: string
				/** Format: 'dmY' or 'Y-m-d H:i:s' */
				date: string
				/** Group ID */
				id: number
				/** 0=expenditure, 1=income, 2=transfer */
				type: 1
				user_id: number
			},
		) {
			return posterFetch<number>(
				`/finance.createTransactions?${new URLSearchParams({ token })}`,
				{
					body: JSON.stringify({ ...body, amount_to: body.amount_to / 100 }),
					defaultErrorMessage: 'Failed to create transactions',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},

		/**
		 * Get a financial transaction by ID
		 *
		 * Retrieves details of a specific financial transaction including
		 * amount, associated client, and user who created it.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/finance/getTransaction
		 */
		getTransaction(token: string, id: string) {
			return posterFetch<
				{
					amount: string
					client_id: string
					transaction_id: string
					user_id: string
				}[]
			>(
				`/finance.getTransaction?${new URLSearchParams({ token, transaction_id: id })}`,
				{
					defaultErrorMessage: 'Failed to get transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			).then((response) => response.at(0) ?? null)
		},
	},
	/**
	 * Online Orders and Reservations API
	 *
	 * Methods for creating and managing online orders (web/app orders).
	 * These orders appear as "incoming orders" in the Poster dashboard
	 * and must be accepted by staff before processing.
	 *
	 * Order statuses:
	 * - 0: New (awaiting acceptance)
	 * - 1: Accepted (being prepared)
	 * - 7: Canceled
	 *
	 * Service modes:
	 * - 1: Dine-in
	 * - 2: Takeout
	 * - 3: Delivery
	 *
	 * @see https://dev.joinposter.com/en/docs/v3/web/incomingOrders/index
	 */
	incomingOrders: {
		/**
		 * Create a new online order
		 *
		 * Creates an incoming order that appears in the Poster dashboard.
		 * Staff must accept the order before it becomes a regular transaction.
		 * The order can include prepayment information if already paid online.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/incomingOrders/createIncomingOrder
		 */
		createIncomingOrder(
			token: string,
			{
				serviceMode,
				table_id,
				...body
			}: Omit<CreateOrder, 'payment'> & {
				payment: { sum: string; type: 1 }
			},
			clientId: number,
		) {
			const finalOrderData = {
				...body,
				client_id: clientId,
				service_mode: serviceMode,
				spot_id: 1,
				table_id: table_id ? Number(table_id) : null,
			}

			return posterFetch<{
				/** Online order ID */
				incoming_order_id: number
				/** 0=new, 1=accepted, 7=canceled */
				status: number
				/** Associated POS transaction ID (null until accepted) */
				transaction_id: number
			}>(
				`/incomingOrders.createIncomingOrder?${getSearchParameters({ token })}`,
				{
					body: JSON.stringify(finalOrderData),
					defaultErrorMessage: 'Failed to create order',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},

		/**
		 * Get a specific incoming order by ID
		 *
		 * Retrieves detailed information about an incoming order including
		 * customer info and ordered products.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/incomingOrders/getIncomingOrder
		 */
		async getIncomingOrder(token: string, id: string) {
			const data = (await fetch(
				`${BASE_URL}/incomingOrders.getIncomingOrder?${getSearchParameters({ incoming_order_id: id, token })}`,
			).then((response) => response.json())) as PosterResponse<{
				client_id: number
				products: unknown[]
			}>

			if (data.response) return data.response

			getCurrentScope().setExtra('Fetch Data', data)

			throw new Error('Failed to get incoming order')
		},

		/**
		 * Get all incoming orders with optional status filter
		 *
		 * Retrieves a list of incoming (online) orders. Can be filtered by status
		 * to show only new, accepted, or canceled orders.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/incomingOrders/getIncomingOrders
		 */
		async getIncomingOrders(
			token: string,
			options?: {
				/** '0'=new, '1'=accepted, '7'=canceled */
				status?: '0' | '1' | '7'
			},
		) {
			const data = (await fetch(
				`${BASE_URL}/incomingOrders.getIncomingOrders?${getSearchParameters({ token, ...options })}`,
			).then((response) => response.json())) as PosterResponse<IncomingOrder[]>

			if (data.response) return data.response

			getCurrentScope().setExtra('Fetch Data', data)

			throw new Error('Failed to get incoming orders')
		},
	},
	/**
	 * Products - Menu Management API
	 *
	 * Methods for retrieving menu items, categories, and product details.
	 * Products can be of different types: products (inventory items),
	 * dishes (prepared items), and semi-finished products.
	 *
	 * Product types:
	 * - 1: Semi-finished product
	 * - 2: Dish (prepared item)
	 * - 3: Product (inventory item)
	 *
	 * @see https://dev.joinposter.com/en/docs/v3/web/menu/index
	 */
	menu: {
		/**
		 * Get all product categories
		 *
		 * Retrieves the list of menu categories. Categories organize products
		 * and can have their own tax settings and visibility per location.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/menu/getCategories
		 */
		async getMenuCategories(token: string) {
			const data = (await fetch(
				`${BASE_URL}/menu.getCategories?${getSearchParameters({ token })}`,
			).then((response) => response.json())) as PosterResponse<Category[]>

			if (data.response !== null && data.response !== undefined)
				return data.response

			throw new Error('Failed to get menu categories')
		},

		/**
		 * Get list of products and dishes
		 *
		 * Retrieves all products/dishes with their details including:
		 * - Pricing per location (spots)
		 * - Modifications and variants
		 * - Ingredients (for dishes)
		 * - Photos and barcodes
		 * - Visibility settings
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/menu/getProducts
		 */
		getMenuProducts(
			token: string,
			_options: {
				type: 'categories' | 'products'
			} = defaultGetMenuProductsOptions,
		) {
			return posterFetch<Product[]>(
				`/menu.getProducts?${getSearchParameters({ token })}`,
				{
					defaultErrorMessage: 'Failed to get menu products',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
		},

		/**
		 * Get a single product by ID
		 *
		 * Retrieves detailed information about a specific product including
		 * all modifications, ingredients, and location-specific pricing.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/menu/getProduct
		 */
		getProduct(token: string, id: string) {
			return posterFetch<Product>(
				`/menu.getProduct?${getSearchParameters({ product_id: id, token })}`,
				{
					defaultErrorMessage: 'Failed to get product',
					headers: { 'Content-Type': 'application/json' },
					method: 'GET',
				},
			)
		},
	},
	/**
	 * Orders - Transaction Management API
	 *
	 * Methods for managing POS transactions (orders). Transactions represent
	 * active orders that can be modified and eventually closed (paid).
	 *
	 * Payment methods for closeTransaction:
	 * - payed_cash: Cash payment
	 * - payed_card: Card payment
	 * - payed_cert: Gift card payment
	 * - payed_third_party: Third-party payment (e.g., Stripe, online)
	 *
	 * @see https://dev.joinposter.com/en/docs/v3/web/transactions/index
	 */
	transactions: {
		/**
		 * Add a product to an existing transaction
		 *
		 * Adds a product with optional modifiers to an open transaction.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/transactions/addTransactionProduct
		 */
		addTransactionProduct(
			token: string,
			body: {
				/** Product count */
				count: number
				/** Array of modifier IDs */
				modification?: string
				/** Product price in cents */
				price: number
				/** Product ID */
				product_id: string
				/** Location ID */
				spot_id: number
				/** Register ID */
				spot_tablet_id: number
				/** Transaction ID to add product to */
				transaction_id: number
				/** Guest number */
				guest_number: number
			},
		) {
			return posterFetch<{
				/** Created transaction product ID */
				transaction_product_id: number
			}>(
				`/transactions.addTransactionProduct?${getSearchParameters({ token })}`,
				{
					body: JSON.stringify(body),
					defaultErrorMessage: 'Failed to add product to transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},

		/**
		 * Add a customer to an existing transaction
		 *
		 * Associates a customer with an open transaction. Must be called after
		 * createTransaction since that endpoint doesn't support client assignment.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/transactions/changeClient
		 */
		changeClient(
			token: string,
			body: {
				/** Customer ID to associate with the transaction */
				client_id: number
				location_id: number
				spot_id: number
				spot_tablet_id: number
				/** Transaction ID to update */
				transaction_id: number
			},
		) {
			return posterFetch<{
				/** Response (1 on success) */
				response: number
			}>(`/transactions.changeClient?${getSearchParameters({ token })}`, {
				body: JSON.stringify(body),
				defaultErrorMessage: 'Failed to change transaction client',
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			})
		},

		/**
		 * Close a transaction (mark as paid)
		 *
		 * Finalizes an order by recording payment information and closing
		 * the transaction. Supports multiple payment types including
		 * third-party payments like Stripe.
		 *
		 * Payment types can be combined (mixed payment):
		 * - payed_cash: Amount paid in cash
		 * - payed_card: Amount paid by card
		 * - payed_cert: Amount paid by gift card
		 * - payed_third_party: Amount paid via third-party (Stripe)
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/transactions/closeTransaction
		 */
		closeTransaction(
			token: string,
			body: {
				/** Customer ID to associate with transaction */
				clientId?: number
				/** Amount paid via third-party (Stripe) in cents */
				payed_third_party: number
				/** Stripe payment intent ID for tracking */
				paymentIntentId: string
				transaction_id: number
			},
		) {
			const parsedBody = {
				...(body.clientId ? { client_id: body.clientId } : {}),
				comment: `Stripe Payment: ${body.paymentIntentId}`,
				payed_third_party: body.payed_third_party,
				spot_id: 1,
				spot_tablet_id: 1,
				transaction_id: body.transaction_id,
			}

			return posterFetch<number>(
				`/transactions.closeTransaction?${getSearchParameters({ token })}`,
				{
					body: JSON.stringify(parsedBody),
					defaultErrorMessage: 'Failed to close transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},

		/**
		 * Create a new transaction (order) directly at a table
		 *
		 * Creates an open transaction at a specific table. Use this for
		 * dine-in orders where the customer is at a table and will pay later.
		 * Returns the transaction ID which can be used to add products.
		 *
		 * Note: To associate a customer, call changeClient after this.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/transactions/createTransaction
		 */
		createTransaction(
			token: string,
			body: {
				/** Number of guests at the table */
				guests_count?: number
				/** Establishment ID */
				spot_id: number
				/** Terminal ID */
				spot_tablet_id: number
				/** Table ID for dine-in orders */
				table_id: number
				/** Staff user ID creating the order */
				user_id: number
			},
		) {
			return posterFetch<{
				/** Created transaction ID */
				transaction_id: number
			}>(`/transactions.createTransaction?${getSearchParameters({ token })}`, {
				body: JSON.stringify(body),
				defaultErrorMessage: 'Failed to create transaction',
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			})
		},

		/**
		 * Update a financial transaction (for e-Wallet payments)
		 *
		 * Updates a financial transaction record. Used internally for
		 * recording e-Wallet payment associations with orders.
		 *
		 * Note: This actually calls finance.updateTransactions endpoint.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/finance/updateTransactions
		 */
		updateTransaction(
			token: string,
			body: {
				orderId: number
				transactionId: number
				userId: number
			},
		) {
			const parsedBody = {
				account_from: body.orderId,
				amount_to: 0,
				comment: 'eWallet payment',
				transaction_id: body.transactionId,
				/** Transaction type: 0—expenditure, 1—income, 2—transfer */
				type: 1,
				user_id: body.userId,
			}

			return posterFetch<number>(
				`/finance.updateTransactions?${new URLSearchParams({ token })}`,
				{
					body: JSON.stringify(parsedBody),
					defaultErrorMessage: 'Failed to update transaction',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},
	},
}

/**
 * Close a Poster order using gift card payment
 *
 * Simplified function to close a transaction using gift card (certificate) payment.
 * Uses the transactions.closeTransaction endpoint.
 *
 * @see https://dev.joinposter.com/en/docs/v3/web/transactions/closeTransaction
 */
export function closePosterOrder(
	token: string,
	body: {
		/** Amount paid via gift card in cents */
		payed_cert: number
		transaction_id: number
	},
) {
	return posterFetch<number>(
		`/transactions.closeTransaction?${new URLSearchParams({ token })}`,
		{
			body: JSON.stringify({ ...body, spot_id: 1, spot_tablet_id: 1 }),
			defaultErrorMessage: 'Failed to close order',
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
		},
	)
}

/**
 * Send an SMS message via AWS SNS
 *
 * Sends a text message to the specified phone number using AWS Simple
 * Notification Service. Used for OTP verification and notifications.
 *
 * Note: This is NOT the Poster API sendSms endpoint, but uses AWS SNS directly.
 */
export function sendSms(
	/** Unused (kept for API consistency) */
	_token: string,
	/** International format, e.g. "+1234567890" */
	phone: string,
	message: string,
) {
	return snsClient.send(
		new PublishCommand({ Message: message, PhoneNumber: phone }),
	)
}
