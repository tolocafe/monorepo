/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- API data types may not reflect runtime nullability */
import * as Sentry from '@sentry/cloudflare'
import { desc, eq } from 'drizzle-orm'

import { getDatabase } from '~workers/db/client'
import {
	clientGroups,
	customers,
	dishes,
	ingredients,
	locations,
	menuCategories,
	orderLines,
	productIngredients,
	productModifierGroups,
	productModifiers,
	products,
	syncState,
	transactionProductModifiers,
	transactions,
} from '~workers/db/schema'
import { notifyApplePassUpdate } from '~workers/utils/apns'
import { api } from '~workers/utils/poster'

import type {
	ClientData,
	DashTransaction,
	PosterIngredient,
	PosterModification,
	PosterModificationGroup,
	Product as PosterProduct,
} from '~common/api'

import type { Bindings } from '../types'

export type Database = ReturnType<typeof getDatabase>

export type SyncResult = {
	created: DashTransaction[]
	errors: number
	errorSamples?: string[]
	fetchedCount?: number
	startCursor?: null | number
	synced: number
	toProcessCount?: number
	updated: DashTransaction[]
}

type Cache = {
	categories: Set<number>
	clientGroups: Set<number>
	customers: Set<number>
	ingredients: Set<number>
	locations: Set<number>
	modifierGroups: Set<number>
	modifiers: Set<number>
	products: Set<number>
}

/**
 * Tiered sync strategy:
 * - Today: Always sync incrementally (from cursor)
 * - Last week: Update weekly (if last sync > 1 day ago)
 * - Last month: Update weekly (if last sync > 1 week ago)
 * - All transactions: Full sync monthly (if last sync > 1 month ago)
 */
export default async function syncTransactions(
	token: string,
	hyperdrive: Bindings['HYPERDRIVE'],
	passDatabase: D1Database,
	environment: Bindings,
) {
	const startTime = Date.now()
	// eslint-disable-next-line no-console
	console.log('[syncTransactions] Starting tiered sync...')

	const database_ = getDatabase(hyperdrive)

	try {
		Sentry.addBreadcrumb({
			category: 'sync',
			level: 'info',
			message: 'Starting tiered data sync',
		})

		const state = await getTransactionCursor(database_)
		const now = new Date()
		const nowISO = now.toISOString()

		// Calculate date ranges
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const oneDayAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24)
		const oneWeekAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)
		const oneMonthAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)

		// Determine what needs syncing
		const needsAllSync =
			!state?.lastAllSyncAt || new Date(state.lastAllSyncAt) < oneMonthAgo
		const needsMonthSync =
			!state?.lastMonthSyncAt || new Date(state.lastMonthSyncAt) < oneWeekAgo
		const needsWeekSync =
			!state?.lastWeekSyncAt || new Date(state.lastWeekSyncAt) < oneDayAgo

		// eslint-disable-next-line no-console
		console.log('[syncTransactions] Sync needs:', {
			all: needsAllSync,
			month: needsMonthSync,
			today: true,
			week: needsWeekSync,
		})

		const allCreated: DashTransaction[] = []
		const allUpdated: DashTransaction[] = []
		let totalErrors = 0
		const errorSamples: string[] = []

		// 1. Sync all transactions (monthly)
		if (needsAllSync) {
			// eslint-disable-next-line no-console
			console.log(
				'[syncTransactions] ⚡ Syncing ALL transactions (monthly full sync)...',
			)
			const allSyncStart = Date.now()
			const result = await syncDateRange(
				database_,
				token,
				passDatabase,
				environment,
				null, // No date limit - sync all
				false, // Don't stop at cursor
			)
			const allSyncDuration = Date.now() - allSyncStart
			// eslint-disable-next-line no-console
			console.log(
				`[syncTransactions] ✅ All sync complete: ${result.created.length} created, ${result.updated.length} updated, ${result.errors} errors in ${allSyncDuration}ms`,
			)
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastAllSyncAt', nowISO)
		}

		// 2. Sync last month (weekly)
		if (needsMonthSync) {
			// eslint-disable-next-line no-console
			console.log('[syncTransactions] 📅 Syncing last month (weekly update)...')
			const monthSyncStart = Date.now()
			const result = await syncDateRange(
				database_,
				token,
				passDatabase,
				environment,
				oneMonthAgo,
				false, // Update all in range
			)
			const monthSyncDuration = Date.now() - monthSyncStart
			// eslint-disable-next-line no-console
			console.log(
				`[syncTransactions] ✅ Month sync complete: ${result.created.length} created, ${result.updated.length} updated, ${result.errors} errors in ${monthSyncDuration}ms`,
			)
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastMonthSyncAt', nowISO)
		}

		// 3. Sync last week (daily)
		if (needsWeekSync) {
			// eslint-disable-next-line no-console
			console.log('[syncTransactions] 📆 Syncing last week (daily update)...')
			const weekSyncStart = Date.now()
			const result = await syncDateRange(
				database_,
				token,
				passDatabase,
				environment,
				oneWeekAgo,
				false, // Update all in range
			)
			const weekSyncDuration = Date.now() - weekSyncStart
			// eslint-disable-next-line no-console
			console.log(
				`[syncTransactions] ✅ Week sync complete: ${result.created.length} created, ${result.updated.length} updated, ${result.errors} errors in ${weekSyncDuration}ms`,
			)
			allCreated.push(...result.created)
			allUpdated.push(...result.updated)
			totalErrors += result.errors
			errorSamples.push(...result.errorSamples)
			await updateSyncTimestamp(database_, 'lastWeekSyncAt', nowISO)
		}

		// 4. Always sync today (incremental from cursor)
		// eslint-disable-next-line no-console
		console.log(
			'[syncTransactions] 🕐 Syncing today (incremental from cursor)...',
		)
		const todaySyncStart = Date.now()
		const todayResult = await syncDateRange(
			database_,
			token,
			passDatabase,
			environment,
			today,
			true, // Stop at cursor for incremental sync
		)
		const todaySyncDuration = Date.now() - todaySyncStart
		// eslint-disable-next-line no-console
		console.log(
			`[syncTransactions] ✅ Today sync complete: ${todayResult.created.length} created, ${todayResult.updated.length} updated, ${todayResult.errors} errors in ${todaySyncDuration}ms`,
		)
		allCreated.push(...todayResult.created)
		allUpdated.push(...todayResult.updated)
		totalErrors += todayResult.errors
		errorSamples.push(...todayResult.errorSamples)

		// Update today sync timestamp and cursor
		if (todayResult.lastProcessedId) {
			await upsertSyncState(database_, todayResult.lastProcessedId)
		}
		await updateSyncTimestamp(database_, 'lastTodaySyncAt', nowISO)

		const duration = Date.now() - startTime

		Sentry.setContext('Sync Results', {
			created: allCreated.length,
			duration_ms: duration,
			errors: totalErrors,
			synced: allCreated.length + allUpdated.length,
			updated: allUpdated.length,
		})

		Sentry.captureMessage(
			`sync:done created=${allCreated.length} updated=${allUpdated.length} errors=${totalErrors}`,
			totalErrors > 0 ? 'warning' : 'info',
		)

		return {
			created: allCreated,
			errors: totalErrors,
			errorSamples,
			fetchedCount: todayResult.fetchedCount ?? 0,
			startCursor: state?.lastTransactionId ?? null,
			synced: allCreated.length + allUpdated.length,
			toProcessCount: todayResult.toProcessCount ?? 0,
			updated: allUpdated,
		}
	} catch (error) {
		const duration = Date.now() - startTime
		const errorMessage = error instanceof Error ? error.message : String(error)
		const errorStack = error instanceof Error ? error.stack : undefined

		// eslint-disable-next-line no-console
		console.error('[syncTransactions] ❌ FATAL ERROR:', errorMessage)
		if (errorStack) {
			// eslint-disable-next-line no-console
			console.error('[syncTransactions] Stack:', errorStack)
		}

		Sentry.setContext('Sync Error', {
			duration_ms: duration,
			error: errorMessage,
			stack: errorStack,
		})

		Sentry.captureException(error, {
			level: 'error',
			tags: { sync_operation: 'transactions' },
		})

		return {
			created: [],
			errors: 1,
			errorSamples: [errorMessage],
			synced: 0,
			updated: [],
		}
	}
}

function createCaches(): Cache {
	return {
		categories: new Set(),
		clientGroups: new Set(),
		customers: new Set(),
		ingredients: new Set(),
		locations: new Set(),
		modifierGroups: new Set(),
		modifiers: new Set(),
		products: new Set(),
	}
}

async function ensureCategory(
	database: Database,
	token: string,
	id: number,
	cache: Cache,
) {
	if (cache.categories.has(id)) return

	const existing = await database
		.select()
		.from(menuCategories)
		.where(eq(menuCategories.id, id))
		.then((rows) => rows.at(0))
	if (existing) {
		cache.categories.add(id)
		return
	}

	let foundCategory = null
	try {
		const categories = await api.menu.getMenuCategories(token)
		foundCategory = categories.find(
			(category) => Number.parseInt(category.category_id, 10) === id,
		)
	} catch (error) {
		Sentry.captureException(error, {
			extra: { categoryId: id },
			level: 'warning',
			tags: { operation: 'category_fetch' },
		})
	}

	const payload =
		foundCategory &&
		({
			color: foundCategory.category_color,
			hidden: foundCategory.category_hidden === '1',
			id,
			name: foundCategory.category_name,
			parentId: foundCategory.parent_category
				? Number.parseInt(foundCategory.parent_category, 10)
				: null,
			sortOrder: Number.parseInt(foundCategory.sort_order, 10),
			tag: foundCategory.category_tag ?? null,
			taxId: Number.parseInt(foundCategory.tax_id, 10),
			visibleRaw: JSON.stringify(foundCategory.visible ?? []),
		} satisfies typeof menuCategories.$inferInsert)

	if (payload) {
		await database.insert(menuCategories).values(payload).onConflictDoUpdate({
			set: payload,
			target: menuCategories.id,
		})
		cache.categories.add(id)
		return
	}

	// Store stub if not found
	await database
		.insert(menuCategories)
		.values({ id, name: `category-${id}` })
		.onConflictDoNothing()
	cache.categories.add(id)
}

async function ensureClientGroup(
	database: Database,
	id: number,
	name: null | string,
	cache: Cache,
) {
	if (cache.clientGroups.has(id)) return

	const existing = await database
		.select()
		.from(clientGroups)
		.where(eq(clientGroups.id, id))
		.then((rows) => rows.at(0))

	if (existing) {
		cache.clientGroups.add(id)
		return
	}

	await database.insert(clientGroups).values({ id, name }).onConflictDoUpdate({
		set: { name },
		target: clientGroups.id,
	})

	cache.clientGroups.add(id)
}

async function ensureCustomer(
	database: Database,
	token: string,
	id: number,
	cache: Cache,
) {
	if (cache.customers.has(id)) return

	const existing = await database
		.select()
		.from(customers)
		.where(eq(customers.id, id))
		.then((rows) => rows.at(0))

	if (existing) {
		cache.customers.add(id)
		return
	}

	const payload = await api.clients.getClientById(token, id)
	const clientGroupId =
		payload?.client_groups_id && payload.client_groups_id !== '0'
			? Number.parseInt(payload.client_groups_id, 10)
			: null
	const clientGroupName = payload?.client_groups_name ?? null

	if (clientGroupId) {
		await ensureClientGroup(database, clientGroupId, clientGroupName, cache)
	}

	const parsed = mapClient(payload, id)

	await database.insert(customers).values(parsed).onConflictDoUpdate({
		set: parsed,
		target: customers.id,
	})

	cache.customers.add(id)
}

async function ensureIngredient(
	database: Database,
	ingredient: PosterIngredient,
	cache: Cache,
) {
	const id = Number.parseInt(ingredient.ingredient_id, 10)
	if (cache.ingredients.has(id)) return

	const payload = {
		id,
		lossesRaw: JSON.stringify({
			bake: ingredient.ingredients_losses_bake,
			clear: ingredient.ingredients_losses_clear,
			cook: ingredient.ingredients_losses_cook,
			fry: ingredient.ingredients_losses_fry,
			stew: ingredient.ingredients_losses_stew,
		}),
		name: ingredient.ingredient_name,
		unit: ingredient.ingredient_unit ?? null,
		weight: ingredient.ingredient_weight ?? null,
	} satisfies typeof ingredients.$inferInsert

	await database.insert(ingredients).values(payload).onConflictDoUpdate({
		set: payload,
		target: ingredients.id,
	})

	cache.ingredients.add(id)
}

async function ensureLocation(database: Database, id: number, cache: Cache) {
	if (cache.locations.has(id)) return

	await database.insert(locations).values({ id }).onConflictDoNothing()

	cache.locations.add(id)
}

async function ensureModifier(database: Database, id: number, cache: Cache) {
	if (!Number.isFinite(id) || id <= 0) return
	if (cache.modifiers.has(id)) return
	const existing = await database
		.select()
		.from(productModifiers)
		.where(eq(productModifiers.id, id))
		.then((rows) => rows.at(0))
	if (existing) {
		cache.modifiers.add(id)
		return
	}

	// Attempt to hydrate via product.fetch is not straightforward; store stub
	await database
		.insert(productModifiers)
		.values({
			id,
			isDeleted: false,
			name: `modifier-${id}`,
		} as unknown as typeof productModifiers.$inferInsert)
		.onConflictDoNothing()
	cache.modifiers.add(id)
}

async function ensureProduct(
	database: Database,
	token: string,
	id: number,
	cache: Cache,
) {
	if (cache.products.has(id)) return

	const existing = await database
		.select()
		.from(products)
		.where(eq(products.id, id))
		.then((rows) => rows.at(0))
	if (existing) {
		cache.products.add(id)
		return
	}

	let product: null | PosterProduct = null
	try {
		product = await api.menu.getProduct(token, id.toString())
	} catch (error) {
		Sentry.captureException(error, {
			extra: { productId: id },
			level: 'warning',
			tags: { operation: 'product_fetch' },
		})
	}

	if (!product) {
		await database
			.insert(products)
			.values({
				id,
				name: `product-${id}`,
			} satisfies typeof products.$inferInsert)
			.onConflictDoNothing()
		cache.products.add(id)
		return
	}
	if (product.menu_category_id) {
		await ensureCategory(
			database,
			token,
			Number.parseInt(product.menu_category_id, 10),
			cache,
		)
	}

	const payload = mapProduct(product)
	await database.insert(products).values(payload).onConflictDoUpdate({
		set: payload,
		target: products.id,
	})

	await upsertProductModifiers(database, product, cache)
	await upsertProductIngredients(database, product, cache)
	await upsertDish(database, product)

	cache.products.add(id)
}

/**
 * Fetch transactions for a date range with automatic pagination/chunking.
 * Splits large date ranges into smaller chunks to avoid API limits and memory issues.
 */
async function fetchTransactionsPaginated(
	token: string,
	dateFrom: Date,
	dateTo: Date,
	options?: {
		/** Maximum days per chunk (default: 30) */
		chunkDays?: number
		/** Maximum transactions per chunk before splitting further */
		maxTransactionsPerChunk?: number
	},
): Promise<DashTransaction[]> {
	const chunkDays = options?.chunkDays ?? 30
	const maxTransactionsPerChunk = options?.maxTransactionsPerChunk ?? 1000

	const totalDays = Math.ceil(
		(dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24),
	)

	// If range is small enough, fetch directly
	if (totalDays <= chunkDays) {
		// eslint-disable-next-line no-console
		console.log(
			`[fetchTransactionsPaginated] Fetching ${totalDays} days directly (${formatApiDate(dateFrom)} to ${formatApiDate(dateTo)})...`,
		)
		const startFetch = Date.now()
		const fetched = await api.dash.getTransactions(token, {
			date_from: formatApiDate(dateFrom),
			date_to: formatApiDate(dateTo),
			include_products: 'true',
		})
		const fetchDuration = Date.now() - startFetch
		// eslint-disable-next-line no-console
		console.log(
			`[fetchTransactionsPaginated] Fetched ${fetched.length} transactions in ${fetchDuration}ms`,
		)

		// If response is too large, split further
		if (fetched.length > maxTransactionsPerChunk && totalDays > 1) {
			// eslint-disable-next-line no-console
			console.log(
				`[fetchTransactionsPaginated] Response too large (${fetched.length} > ${maxTransactionsPerChunk}), splitting into smaller chunks...`,
			)
			const midDate = new Date(
				dateFrom.getTime() + (dateTo.getTime() - dateFrom.getTime()) / 2,
			)
			const [first, second] = await Promise.all([
				fetchTransactionsPaginated(token, dateFrom, midDate, options),
				fetchTransactionsPaginated(token, midDate, dateTo, options),
			])
			// eslint-disable-next-line no-console
			console.log(
				`[fetchTransactionsPaginated] Combined ${first.length} + ${second.length} = ${first.length + second.length} transactions`,
			)
			return [...first, ...second]
		}

		return fetched
	}

	// Split into chunks
	const numberChunks = Math.ceil(totalDays / chunkDays)
	// eslint-disable-next-line no-console
	console.log(
		`[fetchTransactionsPaginated] Splitting ${totalDays} days into ${numberChunks} chunks of ${chunkDays} days...`,
	)

	let currentFrom = new Date(dateFrom)
	const chunks: Promise<DashTransaction[]>[] = []
	let chunkIndex = 0

	while (currentFrom < dateTo) {
		const currentTo = new Date(
			Math.min(
				currentFrom.getTime() + chunkDays * 24 * 60 * 60 * 1000,
				dateTo.getTime(),
			),
		)

		// eslint-disable-next-line no-console
		console.log(
			`[fetchTransactionsPaginated] Chunk ${chunkIndex + 1}/${numberChunks}: ${formatApiDate(currentFrom)} to ${formatApiDate(currentTo)}`,
		)

		chunks.push(
			fetchTransactionsPaginated(token, currentFrom, currentTo, options),
		)

		currentFrom = new Date(currentTo.getTime() + 1) // Start next chunk 1ms after previous
		chunkIndex++
	}

	const startChunks = Date.now()
	const results = await Promise.all(chunks)
	const chunksDuration = Date.now() - startChunks
	const totalFetched = results.reduce((sum, chunk) => sum + chunk.length, 0)
	// eslint-disable-next-line no-console
	console.log(
		`[fetchTransactionsPaginated] Completed ${numberChunks} chunks: ${totalFetched} total transactions in ${chunksDuration}ms`,
	)
	return results.flat()
}

async function findModifierIdByName(database: Database, name: string) {
	if (!name.trim()) return null
	const found = await database
		.select({ id: productModifiers.id })
		.from(productModifiers)
		.where(eq(productModifiers.name, name))
		.orderBy(desc(productModifiers.id))
		.then((rows) => rows.at(0))
	return found?.id ?? null
}

function formatApiDate(date: Date): string {
	return date.toISOString().replace(/T.*/, '')
}

async function getTransactionCursor(database: Database) {
	const rows = await database
		.select()
		.from(syncState)
		.where(eq(syncState.id, 'transactions'))
	return rows.at(0)
}

function mapClient(client: ClientData | null, id: number) {
	return {
		birthday: client?.birthday ?? null,
		bonus: client?.bonus ? Number.parseInt(client.bonus, 10) : null,
		city: client?.city ?? null,
		clientGroupId: client?.client_groups_id
			? Number.parseInt(client.client_groups_id, 10)
			: null,
		clientGroupName: client?.client_groups_name ?? null,
		comment: client?.comment ?? null,
		country: client?.country ?? null,
		createdAt: client?.date_activale ?? null,
		email: client?.email ?? null,
		ewallet: client?.ewallet ? toCents(client.ewallet) : null,
		firstName: client?.firstname ?? null,
		id,
		lastName: client?.lastname ?? null,
		loyaltyType: client?.loyalty_type ?? null,
		patronymic: client?.patronymic ?? null,
		phone: client?.phone ?? client?.phone_number ?? null,
		totalPayedSum: client?.total_payed_sum
			? toCents(client.total_payed_sum)
			: null,
		updatedAt: new Date().toISOString(),
	}
}

function mapModifierGroup(
	group: PosterModificationGroup,
	productId: string,
): typeof productModifierGroups.$inferInsert {
	return {
		id: group.dish_modification_group_id,
		isDeleted: group.is_deleted === 1,
		name: group.name,
		numMax: group.num_max,
		numMin: group.num_min,
		productId: Number.parseInt(productId, 10),
		type: group.type,
	}
}

function mapProduct(product: PosterProduct) {
	const primaryPrice =
		typeof product.price === 'object'
			? Object.values(product.price)[0]
			: product.spots?.[0]?.price

	return {
		barcode: product.barcode ?? null,
		caffeine: product.caffeine ?? null,
		code: product.product_code ?? null,
		color: product.color ?? null,
		description: product.description ?? product['small-description'] ?? null,
		differentSpotRaw: product.different_spots_prices ?? null,
		hidden: product.hidden === '1',
		id: Number.parseInt(product.product_id, 10),
		intensity: product.intensity ?? null,
		masterId: product.master_id ? Number.parseInt(product.master_id, 10) : null,
		menuCategoryId: product.menu_category_id
			? Number.parseInt(product.menu_category_id, 10)
			: null,
		name: product.product_name,
		noDiscount: product.nodiscount === '1',
		outOfStock: product.out ?? null,
		photo: product.photo ?? null,
		photoOrigin: product.photo_origin ?? null,
		priceCents: primaryPrice ? toCents(primaryPrice) : null,
		productionNote: product.product_production_description ?? null,
		profitRaw: product.profit ? JSON.stringify(product.profit) : null,
		recipe: product.recipe ?? null,
		smallDescription: product['small-description'] ?? null,
		sourcesRaw: product.sources ? JSON.stringify(product.sources) : null,
		spotsRaw: product.spots ? JSON.stringify(product.spots) : null,
		taxId: product.tax_id ? Number.parseInt(product.tax_id, 10) : null,
		type: product.type ? Number.parseInt(product.type, 10) : null,
		unit: product.unit ?? null,
		volume: product.volume ?? null,
		weightFlag: product.weight_flag === '1',
		workshop: product.workshop ?? null,
	} satisfies typeof products.$inferInsert
}

/**
 * Sync transactions for a specific date range
 */
async function syncDateRange(
	database: Database,
	token: string,
	passDatabase: D1Database,
	environment: Bindings,
	dateFrom: Date | null, // null = all transactions
	stopAtCursor: boolean, // true = incremental (stop at known transaction)
): Promise<{
	created: DashTransaction[]
	errors: number
	errorSamples: string[]
	fetchedCount?: number
	lastProcessedId?: number
	toProcessCount?: number
	updated: DashTransaction[]
}> {
	const today = new Date()
	const dateFrom_ =
		dateFrom ?? new Date(today.getTime() - 1000 * 60 * 60 * 24 * 365 * 10) // 10 years ago for "all"

	// eslint-disable-next-line no-console
	console.log(
		`[syncDateRange] Fetching from ${formatApiDate(dateFrom_)} to ${formatApiDate(today)}`,
	)

	const fetched = await fetchTransactionsPaginated(token, dateFrom_, today, {
		chunkDays: 30, // Fetch in 30-day chunks
		maxTransactionsPerChunk: 1000, // Split further if > 1000 transactions
	})

	// eslint-disable-next-line no-console
	console.log(`[syncDateRange] Fetched ${fetched.length} transactions`)

	const state = await getTransactionCursor(database)

	const sorted = [...fetched].toSorted(
		(a, b) =>
			Number.parseInt(b.transaction_id, 10) -
			Number.parseInt(a.transaction_id, 10),
	)

	const toProcess: DashTransaction[] = []
	if (stopAtCursor && state?.lastTransactionId) {
		// Incremental: only process new transactions
		for (const tx of sorted) {
			const txId = Number.parseInt(tx.transaction_id, 10)
			if (txId <= state.lastTransactionId) {
				break
			}
			toProcess.push(tx)
		}
	} else {
		// Full update: process all transactions in range
		toProcess.push(...sorted)
	}

	// Process oldest first
	toProcess.reverse()

	// eslint-disable-next-line no-console
	console.log(`[syncDateRange] Processing ${toProcess.length} transactions`)

	const created: DashTransaction[] = []
	const updated: DashTransaction[] = []
	let errors = 0
	const errorSamples: string[] = []
	const caches = createCaches()

	for (let index = 0; index < toProcess.length; index++) {
		const tx = toProcess[index]

		if (index % 100 === 0 && index > 0) {
			// eslint-disable-next-line no-console
			console.log(
				`[syncDateRange] Processing ${index + 1}/${toProcess.length}...`,
			)
		}

		try {
			const upsertResult = await upsertTransaction(
				{
					cache: caches,
					database,
					environment,
					passDatabase,
					token,
				},
				tx,
			)

			if (upsertResult === 'created') {
				created.push(tx)
			} else {
				updated.push(tx)
			}
		} catch (error) {
			errors++
			const message = error instanceof Error ? error.message : String(error)
			if (errorSamples.length < 5) {
				errorSamples.push(message)
			}
			Sentry.captureException(error, {
				contexts: { transaction: { transaction_id: tx.transaction_id } },
				level: 'error',
				tags: { operation: 'transaction_sync' },
			})
		}
	}

	const lastProcessed = toProcess.at(-1)
	const lastProcessedId = lastProcessed
		? Number.parseInt(lastProcessed.transaction_id, 10)
		: undefined

	return {
		created,
		errors,
		errorSamples,
		fetchedCount: fetched.length,
		lastProcessedId,
		toProcessCount: toProcess.length,
		updated,
	}
}

function toCents(value: number | string) {
	const number_ =
		typeof value === 'number'
			? value
			: Number.parseFloat(value.replace(',', '.'))
	if (!Number.isFinite(number_)) return 0
	return Math.round(number_ * 100)
}

function toISO(dateString: string) {
	if (!dateString || !dateString.trim()) return null

	// Poster returns either:
	// 1. Unix timestamp in milliseconds as string (e.g., "1766004553569")
	// 2. "Y-m-d H:i:s" format (e.g., "2023-12-25 14:30:00")

	// Try parsing as Unix timestamp first
	const timestamp = Number.parseInt(dateString, 10)
	if (!Number.isNaN(timestamp) && timestamp > 0) {
		// If it's a reasonable timestamp (after 2000-01-01 and before 2100-01-01)
		if (timestamp > 946684800000 && timestamp < 4102444800000) {
			return new Date(timestamp).toISOString()
		}
	}

	// Fall back to "Y-m-d H:i:s" format parsing
	const parsed = new Date(dateString.replace(' ', 'T') + 'Z')
	if (Number.isNaN(parsed.getTime())) return null
	return parsed.toISOString()
}

async function updateSyncTimestamp(
	database: Database,
	field:
		| 'lastAllSyncAt'
		| 'lastMonthSyncAt'
		| 'lastTodaySyncAt'
		| 'lastWeekSyncAt',
	timestamp: string,
) {
	const existing = await getTransactionCursor(database)
	const payload = {
		[field]: timestamp,
		id: 'transactions',
		...existing,
	}

	await database
		.insert(syncState)
		.values(payload)
		.onConflictDoUpdate({
			set: { [field]: timestamp },
			target: syncState.id,
		})
}

async function upsertDish(database: Database, product: PosterProduct) {
	const id = Number.parseInt(product.product_id, 10)
	const payload = {
		cookingTime: product.cooking_time ?? null,
		id,
		netWeight: product.weight_flag ? Number(product.weight_flag) : null,
		productId: id,
		workshop: product.workshop ?? null,
	} satisfies typeof dishes.$inferInsert

	await database.insert(dishes).values(payload).onConflictDoUpdate({
		set: payload,
		target: dishes.id,
	})
}

async function upsertLineModifiers(
	database: Database,
	transactionId: number,
	lineIndex: number,
	product: NonNullable<DashTransaction['products']>[number],
	cache: Cache,
) {
	const modifiersToPersist: {
		amount?: null | number
		groupName?: null | string
		modifierId: number
		name?: null | string
	}[] = []

	if (product.modification) {
		for (const module_ of product.modification) {
			const modifierId = Number.parseInt(module_.m, 10)
			if (!Number.isFinite(modifierId)) continue
			await ensureModifier(database, modifierId, cache)
			modifiersToPersist.push({
				modifierId,
				name: module_.modification_name ?? null,
			})
		}
	}

	if (product.modifiers) {
		for (const module_ of product.modifiers) {
			if (!module_.name) continue
			const modifierId = await findModifierIdByName(database, module_.name)
			if (modifierId) {
				modifiersToPersist.push({
					groupName: module_.group,
					modifierId,
					name: module_.name,
				})
			}
		}
	}

	for (const modifier of modifiersToPersist) {
		await database
			.insert(transactionProductModifiers)
			.values({
				amount: modifier.amount ?? null,
				groupName: modifier.groupName ?? null,
				lineIndex,
				modifierId: modifier.modifierId,
				name: modifier.name ?? null,
				transactionId,
			})
			.onConflictDoUpdate({
				set: {
					amount: modifier.amount ?? null,
					groupName: modifier.groupName ?? null,
					name: modifier.name ?? null,
				},
				target: [
					transactionProductModifiers.transactionId,
					transactionProductModifiers.lineIndex,
					transactionProductModifiers.modifierId,
				],
			})
	}
}

async function upsertModifier(
	database: Database,
	module_: PosterModification,
	productId: string,
	groupId: null | number,
	cache: Cache,
) {
	const id = module_.dish_modification_id
	if (!Number.isFinite(id) || id <= 0) return
	if (cache.modifiers.has(id)) return

	const safeName = module_.modificator_name?.trim() || `modifier-${id}`
	const payload = {
		groupId,
		id,
		isDeleted: false,
		name: safeName,
		priceDiff: module_.price ? toCents(module_.price) : null,
		productId: Number.parseInt(productId, 10),
	} satisfies typeof productModifiers.$inferInsert

	await database.insert(productModifiers).values(payload).onConflictDoUpdate({
		set: payload,
		target: productModifiers.id,
	})

	cache.modifiers.add(id)
}

async function upsertOrderLines(
	database: Database,
	token: string,
	tx: DashTransaction,
	cache: Cache,
) {
	if (!tx.products) {
		// eslint-disable-next-line no-console
		console.log(`[upsertOrderLines] tx ${tx.transaction_id} has no products`)
		return
	}

	let lineIndex = 0
	for (const product of tx.products) {
		const productId = product.product_id
			? Number.parseInt(product.product_id, 10)
			: null

		if (productId) {
			await ensureProduct(database, token, productId, cache)
		}

		const categoryId = product.category_id
			? Number.parseInt(product.category_id, 10)
			: null

		if (categoryId) {
			await ensureCategory(database, token, categoryId, cache)
		}

		const line = {
			categoryId,
			lineIndex,
			modifiersJson: product.modifiers
				? JSON.stringify(product.modifiers)
				: product.modification
					? JSON.stringify(product.modification)
					: null,
			productId,
			productName: product.product_name ?? null,
			productSum: product.product_sum ? toCents(product.product_sum) : null,
			quantity: product.num ? Number.parseInt(product.num, 10) : null,
			transactionId: Number.parseInt(tx.transaction_id, 10),
		}

		await database
			.insert(orderLines)
			.values(line)
			.onConflictDoUpdate({
				set: line,
				target: [orderLines.transactionId, orderLines.lineIndex],
			})

		await upsertLineModifiers(
			database,
			line.transactionId,
			line.lineIndex,
			product,
			cache,
		)

		lineIndex++
	}
}

async function upsertProductIngredients(
	database: Database,
	product: PosterProduct,
	cache: Cache,
) {
	if (!product.ingredients) return

	for (const ingredient of product.ingredients) {
		await ensureIngredient(database, ingredient, cache)
		await database
			.insert(productIngredients)
			.values({
				ingredientId: Number.parseInt(ingredient.ingredient_id, 10),
				productId: Number.parseInt(product.product_id, 10),
				quantity: ingredient.ingredient_weight ?? null,
			})
			.onConflictDoUpdate({
				set: {
					quantity: ingredient.ingredient_weight ?? null,
				},
				target: [productIngredients.productId, productIngredients.ingredientId],
			})
	}
}

async function upsertProductModifiers(
	database: Database,
	product: PosterProduct,
	cache: Cache,
) {
	if (product.group_modifications) {
		for (const group of product.group_modifications) {
			const groupId = group.dish_modification_group_id
			cache.modifierGroups.add(groupId)

			const groupPayload = mapModifierGroup(group, product.product_id)
			await database
				.insert(productModifierGroups)
				.values(groupPayload)
				.onConflictDoUpdate({
					set: groupPayload,
					target: productModifierGroups.id,
				})

			if (group.modifications) {
				for (const module_ of group.modifications) {
					await upsertModifier(
						database,
						module_,
						product.product_id,
						groupId,
						cache,
					)
				}
			}
		}
	}

	if (product.modifications) {
		for (const module_ of product.modifications) {
			await upsertModifier(database, module_, product.product_id, null, cache)
		}
	}
}

async function upsertSyncState(database: Database, lastTransactionId: number) {
	const payload = {
		id: 'transactions',
		lastTransactionId,
		updatedAt: new Date().toISOString(),
	}

	await database.insert(syncState).values(payload).onConflictDoUpdate({
		set: payload,
		target: syncState.id,
	})
}

async function upsertTransaction(
	context: {
		cache: Cache
		database: Database
		environment: Bindings
		passDatabase: D1Database
		token: string
	},
	tx: DashTransaction,
) {
	const { cache, database, environment, passDatabase, token } = context
	const txId = Number.parseInt(tx.transaction_id, 10)

	const existing = await database
		.select()
		.from(transactions)
		.where(eq(transactions.id, txId))
		.then((rows) => rows.at(0))

	const customerId =
		tx.client_id && tx.client_id !== '0'
			? Number.parseInt(tx.client_id, 10)
			: null
	if (customerId) {
		await ensureCustomer(database, token, customerId, cache)
	}

	const locationId = tx.spot_id ? Number.parseInt(tx.spot_id, 10) : null
	if (locationId) {
		await ensureLocation(database, locationId, cache)
	}

	// NOTE: Order lines are inserted AFTER the transaction due to foreign key constraint
	const payload = {
		bonusUsed: tx.payed_bonus ? toCents(tx.payed_bonus) : null,
		comment: tx.transaction_comment ?? tx.comment ?? null,
		customerId,
		dateClose: tx.date_close ? (toISO(tx.date_close) ?? null) : null,
		dateCreated:
			(tx.date_create ? toISO(tx.date_create) : null) ??
			new Date().toISOString(),
		dateStart: tx.date_start ? (toISO(tx.date_start) ?? null) : null,
		discount: tx.discount ?? null,
		id: txId,
		locationId,
		payedBonus: tx.payed_bonus ? toCents(tx.payed_bonus) : null,
		payedCard: tx.payed_card ? toCents(tx.payed_card) : null,
		payedCash: tx.payed_cash ? toCents(tx.payed_cash) : null,
		payedCert: tx.payed_cert ? toCents(tx.payed_cert) : null,
		payedSum: toCents(tx.payed_sum),
		payedThirdParty: tx.payed_third_party
			? toCents(tx.payed_third_party)
			: null,
		payType: tx.pay_type ? Number.parseInt(tx.pay_type, 10) : null,
		processingStatus: Number.parseInt(tx.processing_status, 10),
		reason: tx.reason ? Number.parseInt(tx.reason, 10) : null,
		roundSum: tx.round_sum ? toCents(tx.round_sum) : null,
		serviceMode: tx.service_mode ? Number.parseInt(tx.service_mode, 10) : null,
		status: Number.parseInt(tx.status, 10),
		sum: tx.sum ? toCents(tx.sum) : null,
		syncedAt: new Date().toISOString(),
		tableId: tx.table_id ? Number.parseInt(tx.table_id, 10) : null,
		tipSum: tx.tip_sum ? toCents(tx.tip_sum) : null,
		// type: 0 = Sale, 1 = Return. Default to 0 (Sale) if null/undefined
		type:
			tx.type !== null && tx.type !== undefined
				? Number.parseInt(String(tx.type), 10)
				: 0,
		updatedAt: new Date().toISOString(),
		userId: tx.user_id ?? null,
	}

	await database.insert(transactions).values(payload).onConflictDoUpdate({
		set: payload,
		target: transactions.id,
	})

	// Insert order lines AFTER transaction (due to foreign key constraint)
	await upsertOrderLines(database, token, tx, cache)

	if (!existing && customerId) {
		await notifyApplePassUpdate(customerId, passDatabase, environment)
	}

	if (!existing) return 'created'
	return 'updated'
}

export { toCents, toISO }
