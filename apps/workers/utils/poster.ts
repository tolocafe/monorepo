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
import * as AWS from '@aws-sdk/client-sns'
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
} from '~common/api'
import type { CreateOrder } from '~common/schemas'

const snsClient = new AWS.SNS({
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
 * Payment method types for e-Wallet transactions
 */
export enum PaymentMethod {
	/** Cash payment */
	Cash = 1,
	/** Card payment */
	Card = 2,
}

/**
 * Gender values for customer profiles
 */
export enum Gender {
	/** Gender not specified */
	NotSpecified = 0,
	/** Male */
	Male = 1,
	/** Female */
	Female = 2,
}

/**
 * Service mode for orders
 */
export enum ServiceMode {
	/** At the table / Dine-in */
	DineIn = '1',
	/** Takeaway */
	Takeout = '2',
	/** Delivery */
	Delivery = '3',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
	/** All transactions */
	All = '0',
	/** Open / In progress */
	Open = '1',
	/** Closed */
	Closed = '2',
	/** Removed / Deleted */
	Removed = '3',
}

/**
 * Incoming order status
 */
export enum IncomingOrderStatus {
	/** New order awaiting acceptance */
	New = 0,
	/** Accepted order being prepared */
	Accepted = 1,
	/** Canceled order */
	Canceled = 7,
}

/**
 * Financial transaction type
 */
export enum FinanceTransactionType {
	/** Expenditure - money out */
	Expenditure = 0,
	/** Income - money in */
	Income = 1,
	/** Transfer between accounts */
	Transfer = 2,
}

/**
 * Payment type for transactions
 */
export enum PayType {
	/** Closed without payment */
	NoPayment = 0,
	/** Payment by cash */
	Cash = 1,
	/** Payment by bank transfer */
	BankTransfer = 2,
	/** Mixed payment (combination of methods) */
	Mixed = 3,
}

/**
 * Processing status of transaction
 */
export enum ProcessingStatus {
	/** Open */
	Open = 10,
	/** Preparing */
	Preparing = 20,
	/** Ready */
	Ready = 30,
	/** En route */
	EnRoute = 40,
	/** Delivered */
	Delivered = 50,
	/** Closed */
	Closed = 60,
	/** Deleted */
	Deleted = 70,
}

/**
 * Entity type for filtering transactions
 */
export enum EntityType {
	/** Filter by client */
	Clients = 'clients',
	/** Filter by location/spot */
	Spots = 'spots',
	/** Filter by waiter */
	Waiters = 'waiters',
}

/**
 * E-Wallet payment options for adding funds to a customer's wallet
 */
type AddEWalletPaymentOptions = {
	amount: number
	client_id: number
	spot_id?: number
	transaction_id?: number
	type: PaymentMethod
}

/**
 * E-Wallet transaction options for withdrawing funds from a customer's wallet
 */
type AddEWalletTransactionOptions = {
	amount: number
	client_id: number
}

/**
 * Customer creation options for registering new customers
 */
type CreateClientOptions = {
	birthday?: string
	bonus?: number
	client_groups_id_client: number
	client_name?: string
	client_sex?: Gender
	email?: string
	phone: string
}

/**
 * Pagination options for fetching paginated customer lists
 */
type GetClientsOptions = {
	num?: number
	offset?: number
}

/**
 * Transaction retrieval options for fetching a single transaction
 */
type GetTransactionOptions = {
	include_history?: 'true'
	include_products?: 'true'
}

/**
 * Transactions filter options for fetching multiple transactions with comprehensive filtering
 */
type GetTransactionsOptions = {
	date_from?: string
	date_to?: string
	id?: string
	include_history?: 'true'
	include_products?: 'true'
	service_mode?: `${ServiceMode}`
	status?: TransactionStatus
	table_id?: string
	type?: EntityType
}

/**
 * Financial transaction creation options for recording income transactions
 */
type CreateFinanceTransactionOptions = {
	account_to: 1
	amount_to: number
	category: number
	comment?: string
	date: string
	id: number
	type: FinanceTransactionType.Income
	user_id: number
}

/**
 * Incoming order status filter for fetching orders
 */
type GetIncomingOrdersOptions = {
	status?: `${IncomingOrderStatus}`
}

/**
 * Close transaction options for finalizing an order with third-party payment
 */
type CloseTransactionOptions = {
	clientId?: number
	payed_third_party: number
	paymentIntentId: string
	transaction_id: number
}

/**
 * Update transaction options for recording e-Wallet payment associations
 */
type UpdateTransactionOptions = {
	orderId: number
	transactionId: number
	userId: number
}

/**
 * Close order options for gift card payment
 */
type ClosePosterOrderOptions = {
	payed_cert: number
	transaction_id: number
}

/**
 * Incoming order response from Poster API
 */
type IncomingOrderResponse = {
	incoming_order_id: number
	status: number
	transaction_id: number
}

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
 * Generic fetch wrapper for Poster API requests with error handling and Sentry context
 *
 * Wraps the Poster API fetch call to provide:
 * - Automatic error handling with custom error messages
 * - Sentry context logging for debugging
 * - Type-safe response parsing
 *
 * @template TResponse - Expected response data type from Poster API
 * @param url - API endpoint path relative to BASE_URL (e.g., '/clients.getClient')
 * @param options - Standard fetch options with optional defaultErrorMessage for error context
 * @param options.defaultErrorMessage - Custom error message to use if API returns an error
 * @returns Promise resolving to the typed response data from `response` field
 * @throws {PosterError} When API returns an error or response field is null
 *
 * @example
 * ```ts
 * const clients = await posterFetch<ClientData[]>('/clients.getClients?token=abc', {
 *   defaultErrorMessage: 'Failed to fetch clients',
 *   headers: { 'Content-Type': 'application/json' },
 *   method: 'GET',
 * })
 * ```
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

	if (data.response != null) {
		return data.response
	}

	throw new PosterError(
		data.error || options.defaultErrorMessage || 'Failed to fetch data',
	)
}

/**
 * Filters out null/undefined values and converts all values to strings
 * @internal
 */
function getCleanedParameters(
	parameters?: Record<string, boolean | number | string | undefined>,
) {
	const filteredParameters = Object.entries(parameters ?? {}).filter(
		([_, value]) => value != null,
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
 * Poster API client organized by API sections
 *
 * @example
 * ```ts
 * // Get a client by phone
 * const client = await api.clients.getClient(token, '+1234567890')
 *
 * // Create an online order
 * const order = await api.incomingOrders.createIncomingOrder(token, orderData, clientId)
 * ```
 */
export const api = {
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
		 * Adds funds to a customer's electronic wallet for loyalty programs.
		 * Amount is automatically converted from cents to currency units.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/addEWalletPayment
		 */
		addEWalletPayment(token: string, body: AddEWalletPaymentOptions) {
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
		 * Deducts funds when customer pays for an order using their e-Wallet balance.
		 * Amount is automatically converted from cents to currency units.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/addEWalletTransaction
		 */
		addEWalletTransaction(token: string, body: AddEWalletTransactionOptions) {
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
		 * Phone numbers must be unique - duplicates will cause an error.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/createClient
		 */
		createClient(token: string, body: CreateClientOptions) {
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
		 * Returns null if not found or on error.
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
		 * Get customer by ID. Returns null if not found.
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
		 * Get paginated list of customers with loyalty data and e-Wallet balance.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/getClients
		 */
		getClients(token: string, options: GetClientsOptions = {}) {
			const { num: number_ = 100, offset = 0 } = options

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
		 * Get all active promotions configured in Poster.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/clients/getPromotions
		 */
		getPromotions(token: string) {
			return posterFetch<Promotion[]>(`/clients.getPromotions?token=${token}`, {
				defaultErrorMessage: 'Failed to get promotions',
			})
		},

		/**
		 * Update customer information. Only provided fields will be updated.
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
		 * Retrieves detailed information about a specific transaction including:
		 * - Payment amounts by method (cash, card, third-party, certificate)
		 * - Tax and tip amounts
		 * - Rounding adjustments
		 * - Customer association
		 * - Optionally: transaction history and product list
		 *
		 * Use `include_products` and `include_history` to get additional transaction details.
		 *
		 * @param token - Poster API access token for authentication
		 * @param id - Transaction ID to retrieve
		 * @param options - Optional flags to include additional data
		 * @returns Promise resolving to transaction data or null if not found
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/dash/getTransaction
		 */
		getTransaction(token: string, id: string, options?: GetTransactionOptions) {
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
					/**
					 * Transaction status
					 * - 0: Deleted
					 * - 1: In progress/Open
					 * - 2: Closed
					 */
					status: string
					sum: string
					tax_sum: string
					tip_sum: string
					transaction_id: string
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
		 * Retrieves the complete list of products included in a transaction along with
		 * their modifications (customizations) and quantities. This is particularly useful for:
		 * - Generating detailed receipts
		 * - Displaying order items with customizations
		 * - Kitchen/barista order displays
		 *
		 * Returns empty array on error instead of throwing for graceful degradation.
		 *
		 * @param token - Poster API access token for authentication
		 * @param transactionId - Transaction ID to get products for
		 * @returns Promise resolving to array of transaction products with modifications
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/dash/getTransactionProducts
		 */
		async getTransactionProducts(
			token: string,
			transactionId: string,
		): Promise<
			{
				/** Category ID this product belongs to */
				category_id: string
				/** Modification/variant ID applied */
				modification_id: string
				/** Name of the modification (null if none) */
				modificator_name: null | string
				/** Quantity ordered */
				num: string
				/** Product ID */
				product_id: string
				/** Product name */
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

			if (data.response != null) return data.response

			return []
		},

		/**
		 * Get a list of transactions with filtering options
		 *
		 * Retrieves transactions with comprehensive filtering capabilities. Use this endpoint for:
		 * - Sales reports and analytics
		 * - Customer purchase history
		 * - Transaction reconciliation
		 * - Order tracking by table, waiter, or location
		 *
		 * **Filtering Options:**
		 * - **Date Range**: Filter by creation date (defaults to last 30 days)
		 * - **Status**: Open, closed, or removed transactions
		 * - **Service Mode**: Dine-in, takeout, or delivery orders
		 * - **Entity**: Filter by customer, location, or waiter
		 * - **Table**: Specific table transactions
		 * - **Additional Data**: Include product lists and operation history
		 *
		 * **Performance Note:** Including products/history increases response size significantly.
		 * Use these flags only when needed.
		 *
		 * @param token - Poster API access token for authentication
		 * @param options - Comprehensive filtering options
		 * @returns Promise resolving to array of DashTransaction objects
		 * @throws {PosterError} If the request fails
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/dash/getTransactions
		 */
		getTransactions(token: string, options?: GetTransactionsOptions) {
			return posterFetch<DashTransaction[]>(
				`/dash.getTransactions?${getSearchParameters({ token, ...options })}`,
				{ defaultErrorMessage: 'Failed to get transactions' },
			)
		},
	},
	/**
	 * Finance - Financial Transactions API
	 *
	 * Methods for creating and retrieving financial transactions separate from POS sales.
	 * These are accounting transactions for tracking income, expenses, and transfers between accounts.
	 *
	 * **Transaction Types:**
	 * - **0**: Expenditure (money out) - Record expenses like supplies, rent, utilities
	 * - **1**: Income (money in) - Record revenue from sources other than POS sales
	 * - **2**: Transfer - Move funds between accounts (e.g., bank to cash register)
	 *
	 * **Common Use Cases:**
	 * - Recording non-POS income (wholesale, catering, tips)
	 * - Tracking business expenses and overhead
	 * - Managing cash flow between accounts
	 * - Financial reporting and reconciliation
	 *
	 * @see https://dev.joinposter.com/en/docs/v3/web/finance/index
	 */
	finance: {
		/**
		 * Create a new financial transaction
		 *
		 * Records an income transaction in Poster's financial system.
		 * Amount is automatically converted from cents to currency units.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/finance/createTransactions
		 */
		createTransaction(token: string, body: CreateFinanceTransactionOptions) {
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
		 * Retrieves details of a specific financial transaction including amount, associated
		 * client, and user who created it. Returns null if transaction not found.
		 *
		 * @param token - Poster API access token for authentication
		 * @param id - Financial transaction ID to retrieve
		 * @returns Promise resolving to transaction data or null if not found
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
		 * Create a dine-in order without prepayment
		 *
		 * Creates an incoming order for dine-in customers that will be paid later.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/incomingOrders/createIncomingOrder
		 */
		createDineInOrder(
			token: string,
			body: {
				comment?: string
				products: {
					count: number
					modification?: { a: number; m: string }[]
					price: number
					product_id: string
				}[]
				tableId: string
			},
			clientId: number,
		) {
			const finalOrderData = {
				client_id: clientId,
				comment: body.comment ?? '',
				products: body.products,
				service_mode: ServiceMode.DineIn,
				spot_id: 1,
				table_id: Number(body.tableId),
			}

			return posterFetch<IncomingOrderResponse>(
				`/incomingOrders.createIncomingOrder?${getSearchParameters({ token })}`,
				{
					body: JSON.stringify(finalOrderData),
					defaultErrorMessage: 'Failed to create dine-in order',
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
				},
			)
		},

		/**
		 * Create a new online order
		 *
		 * Creates an incoming order that appears in the Poster dashboard.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/incomingOrders/createIncomingOrder
		 */
		createIncomingOrder(
			token: string,
			{
				serviceMode,
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
			}

			return posterFetch<IncomingOrderResponse>(
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
		 * Retrieves detailed information about an incoming order including customer info
		 * and ordered products.
		 *
		 * @param token - Poster API access token for authentication
		 * @param id - Incoming order ID to retrieve
		 * @returns Promise resolving to incoming order data
		 * @throws {Error} If order not found or request fails
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

			if (data.response != null) return data.response

			getCurrentScope().setExtra('Fetch Data', data)

			throw new Error('Failed to get incoming order')
		},

		/**
		 * Get all incoming orders with optional status filter
		 *
		 * Retrieves a list of incoming (online) orders. Can be filtered by status
		 * to show only new, accepted, or canceled orders.
		 *
		 * @param token - Poster API access token for authentication
		 * @param options - Optional status filter
		 * @returns Promise resolving to array of IncomingOrder objects
		 * @throws {Error} If request fails
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/incomingOrders/getIncomingOrders
		 */
		async getIncomingOrders(token: string, options?: GetIncomingOrdersOptions) {
			const data = (await fetch(
				`${BASE_URL}/incomingOrders.getIncomingOrders?${getSearchParameters({ token, ...options })}`,
			).then((response) => response.json())) as PosterResponse<IncomingOrder[]>

			if (data.response != null) return data.response

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
		 * @param token - Poster API access token for authentication
		 * @returns Promise resolving to array of Category objects
		 * @throws {Error} If request fails
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/menu/getCategories
		 */
		async getMenuCategories(token: string) {
			const data = (await fetch(
				`${BASE_URL}/menu.getCategories?${getSearchParameters({ token })}`,
			).then((response) => response.json())) as PosterResponse<Category[]>

			if (data.response != null) return data.response

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
		 * @param token - Poster API access token for authentication
		 * @param _options - Reserved for future use (currently unused)
		 * @returns Promise resolving to array of Product objects
		 * @throws {PosterError} If request fails
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/menu/getProducts
		 */
		async getMenuProducts(
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
		 * @param token - Poster API access token for authentication
		 * @param id - Product ID to retrieve
		 * @returns Promise resolving to Product object
		 * @throws {PosterError} If product not found or request fails
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/menu/getProduct
		 */
		async getProduct(token: string, id: string) {
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
		 * Close a transaction (mark as paid)
		 *
		 * Finalizes an order by recording payment information and closing the transaction.
		 * Supports third-party payments like Stripe.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/transactions/closeTransaction
		 */
		async closeTransaction(token: string, body: CloseTransactionOptions) {
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
		 * Update a financial transaction (for e-Wallet payments)
		 *
		 * Updates a financial transaction record for e-Wallet payment associations.
		 *
		 * @see https://dev.joinposter.com/en/docs/v3/web/finance/updateTransactions
		 */
		async updateTransaction(token: string, body: UpdateTransactionOptions) {
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
 *
 * @see https://dev.joinposter.com/en/docs/v3/web/transactions/closeTransaction
 */
export async function closePosterOrder(
	token: string,
	body: ClosePosterOrderOptions,
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
 * Sends a text message using AWS Simple Notification Service.
 * Used for OTP verification and notifications.
 */
export async function sendSms(_token: string, phone: string, message: string) {
	return snsClient.send(
		new AWS.PublishCommand({ Message: message, PhoneNumber: phone }),
	)
}
