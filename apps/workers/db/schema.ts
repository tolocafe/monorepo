import { defineRelations, sql } from 'drizzle-orm'
import {
	boolean,
	integer,
	pgSchema,
	primaryKey,
	text,
} from 'drizzle-orm/pg-core'

// Use a dedicated schema owned by the app (not `public`, not Hyperdrive-owned).
// This makes `drizzle-kit push` work reliably and avoids relying on search_path.
const tolo = pgSchema('tolo')

// ============================================================================
// Tables
// ============================================================================

export const syncState = tolo.table('sync_state', {
	cursor: text('cursor'),
	id: text('id').primaryKey(),
	// Tiered sync timestamps
	lastAllSyncAt: text('last_all_sync_at'), // Full sync (monthly)
	lastMonthSyncAt: text('last_month_sync_at'), // Last month sync (weekly)
	lastTodaySyncAt: text('last_today_sync_at'), // Today sync (every run)
	lastTransactionDate: text('last_transaction_date'),
	lastTransactionId: integer('last_transaction_id'),
	lastWeekSyncAt: text('last_week_sync_at'), // Last week sync (daily)
	updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const clientGroups = tolo.table('client_groups', {
	id: integer('id').primaryKey().notNull(),
	name: text('name'),
})

export const customers = tolo.table('customers', {
	birthday: text('birthday'),
	bonus: integer('bonus'),
	city: text('city'),
	clientGroupId: integer('client_group_id'),
	clientGroupName: text('client_group_name'),
	comment: text('comment'),
	country: text('country'),
	createdAt: text('created_at'),
	email: text('email'),
	ewallet: integer('ewallet'),
	firstName: text('first_name'),
	id: integer('id').primaryKey().notNull(),
	lastName: text('last_name'),
	loyaltyType: text('loyalty_type'),
	patronymic: text('patronymic'),
	phone: text('phone'),
	totalPayedSum: integer('total_payed_sum'),
	updatedAt: text('updated_at'),
})

export const locations = tolo.table('locations', {
	address: text('address'),
	city: text('city'),
	country: text('country'),
	id: integer('id').primaryKey().notNull(),
	name: text('name'),
	servicePhone: text('service_phone'),
	tabletId: integer('tablet_id'),
})

export const menuCategories = tolo.table('menu_categories', {
	color: text('color'),
	hidden: boolean('hidden'),
	id: integer('id').primaryKey().notNull(),
	name: text('name'),
	parentId: integer('parent_id'),
	sortOrder: integer('sort_order'),
	tag: text('tag'),
	taxId: integer('tax_id'),
	visibleRaw: text('visible_raw'),
})

export const products = tolo.table('products', {
	barcode: text('barcode'),
	caffeine: integer('caffeine'),
	code: text('code'),
	color: text('color'),
	description: text('description'),
	differentSpotRaw: text('different_spot_raw'),
	hidden: boolean('hidden'),
	id: integer('id').primaryKey().notNull(),
	intensity: integer('intensity'),
	masterId: integer('master_id'),
	menuCategoryId: integer('menu_category_id'),
	name: text('name').notNull(),
	noDiscount: boolean('no_discount'),
	outOfStock: integer('out_of_stock'),
	photo: text('photo'),
	photoOrigin: text('photo_origin'),
	priceCents: integer('price_cents'),
	productionNote: text('production_note'),
	profitRaw: text('profit_raw'),
	recipe: text('recipe'),
	smallDescription: text('small_description'),
	sourcesRaw: text('sources_raw'),
	spotsRaw: text('spots_raw'),
	taxId: integer('tax_id'),
	type: integer('type'),
	unit: text('unit'),
	volume: integer('volume'),
	weightFlag: boolean('weight_flag'),
	workshop: text('workshop'),
})

export const productModifierGroups = tolo.table('product_modifier_groups', {
	id: integer('id').primaryKey().notNull(),
	isDeleted: boolean('is_deleted'),
	name: text('name'),
	numMax: integer('num_max'),
	numMin: integer('num_min'),
	productId: integer('product_id'),
	type: integer('type'),
})

export const productModifiers = tolo.table('product_modifiers', {
	groupId: integer('group_id'),
	id: integer('id').primaryKey().notNull(),
	isDeleted: boolean('is_deleted'),
	name: text('name').notNull(),
	priceDiff: integer('price_diff'),
	productId: integer('product_id'),
})

export const ingredients = tolo.table('ingredients', {
	cost: integer('cost'),
	id: integer('id').primaryKey().notNull(),
	lossesRaw: text('losses_raw'),
	name: text('name').notNull(),
	unit: text('unit'),
	weight: integer('weight'),
})

export const dishes = tolo.table('dishes', {
	cookingTime: text('cooking_time'),
	id: integer('id').primaryKey().notNull(),
	netWeight: integer('net_weight'),
	productId: integer('product_id'),
	workshop: text('workshop'),
})

export const productIngredients = tolo.table(
	'product_ingredients',
	{
		ingredientId: integer('ingredient_id').notNull(),
		productId: integer('product_id').notNull(),
		quantity: integer('quantity'),
	},
	(table) => [primaryKey({ columns: [table.productId, table.ingredientId] })],
)

export const transactions = tolo.table('transactions', {
	bonusUsed: integer('bonus_used'),
	comment: text('comment'),
	customerId: integer('customer_id'),
	dateClose: text('date_close'),
	dateCreated: text('date_created').notNull(),
	dateStart: text('date_start'),
	discount: integer('discount'),
	id: integer('id').primaryKey().notNull(),
	locationId: integer('location_id'),
	payedBonus: integer('payed_bonus'),
	payedCard: integer('payed_card'),
	payedCash: integer('payed_cash'),
	payedCert: integer('payed_cert'),
	payedSum: integer('payed_sum').notNull(),
	payedThirdParty: integer('payed_third_party'),
	payType: integer('pay_type'),
	processingStatus: integer('processing_status').notNull(),
	reason: integer('reason'),
	roundSum: integer('round_sum'),
	serviceMode: integer('service_mode'),
	status: integer('status').notNull(),
	sum: integer('sum'),
	syncedAt: text('synced_at').default(sql`CURRENT_TIMESTAMP`),
	tableId: integer('table_id'),
	tipSum: integer('tip_sum'),
	type: integer('type'),
	updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	userId: integer('user_id'),
})

export const orderLines = tolo.table(
	'order_lines',
	{
		categoryId: integer('category_id'),
		lineIndex: integer('line_index').notNull(),
		modifiersJson: text('modifiers_json'),
		productId: integer('product_id'),
		productName: text('product_name'),
		productSum: integer('product_sum'),
		quantity: integer('quantity'),
		transactionId: integer('transaction_id').notNull(),
	},
	(table) => [primaryKey({ columns: [table.transactionId, table.lineIndex] })],
)

export const transactionProductModifiers = tolo.table(
	'transaction_product_modifiers',
	{
		amount: integer('amount'),
		groupName: text('group_name'),
		lineIndex: integer('line_index').notNull(),
		modifierId: integer('modifier_id').notNull(),
		name: text('name'),
		transactionId: integer('transaction_id').notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.transactionId, table.lineIndex, table.modifierId],
		}),
	],
)

// ============================================================================
// Relations (Drizzle Relations v2 - for query builder with eager loading)
// ============================================================================

export const relations = defineRelations(
	{
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
		transactionProductModifiers,
		transactions,
	},
	(r) => ({
		clientGroups: {
			customers: r.many.customers(),
		},
		customers: {
			clientGroup: r.one.clientGroups({
				from: r.customers.clientGroupId,
				to: r.clientGroups.id,
			}),
			transactions: r.many.transactions(),
		},
		dishes: {
			product: r.one.products({
				from: r.dishes.productId,
				to: r.products.id,
			}),
		},
		ingredients: {
			productIngredients: r.many.productIngredients(),
		},
		locations: {
			transactions: r.many.transactions(),
		},
		menuCategories: {
			children: r.many.menuCategories({
				alias: 'parentChild',
				from: r.menuCategories.id,
				to: r.menuCategories.parentId,
			}),
			parent: r.one.menuCategories({
				alias: 'parentChild',
				from: r.menuCategories.parentId,
				to: r.menuCategories.id,
			}),
			products: r.many.products(),
		},
		orderLines: {
			modifiers: r.many.transactionProductModifiers({
				from: [r.orderLines.transactionId, r.orderLines.lineIndex],
				to: [
					r.transactionProductModifiers.transactionId,
					r.transactionProductModifiers.lineIndex,
				],
			}),
			product: r.one.products({
				from: r.orderLines.productId,
				to: r.products.id,
			}),
			transaction: r.one.transactions({
				from: r.orderLines.transactionId,
				to: r.transactions.id,
			}),
		},
		productIngredients: {
			ingredient: r.one.ingredients({
				from: r.productIngredients.ingredientId,
				to: r.ingredients.id,
			}),
			product: r.one.products({
				from: r.productIngredients.productId,
				to: r.products.id,
			}),
		},
		productModifierGroups: {
			modifiers: r.many.productModifiers(),
			product: r.one.products({
				from: r.productModifierGroups.productId,
				to: r.products.id,
			}),
		},
		productModifiers: {
			group: r.one.productModifierGroups({
				from: r.productModifiers.groupId,
				to: r.productModifierGroups.id,
			}),
			product: r.one.products({
				from: r.productModifiers.productId,
				to: r.products.id,
			}),
			transactionModifiers: r.many.transactionProductModifiers(),
		},
		products: {
			dishes: r.many.dishes(),
			menuCategory: r.one.menuCategories({
				from: r.products.menuCategoryId,
				to: r.menuCategories.id,
			}),
			modifierGroups: r.many.productModifierGroups(),
			modifiers: r.many.productModifiers(),
			orderLines: r.many.orderLines(),
			productIngredients: r.many.productIngredients(),
		},
		transactionProductModifiers: {
			modifier: r.one.productModifiers({
				from: r.transactionProductModifiers.modifierId,
				to: r.productModifiers.id,
			}),
			orderLine: r.one.orderLines({
				from: [
					r.transactionProductModifiers.transactionId,
					r.transactionProductModifiers.lineIndex,
				],
				to: [r.orderLines.transactionId, r.orderLines.lineIndex],
			}),
			transaction: r.one.transactions({
				from: r.transactionProductModifiers.transactionId,
				to: r.transactions.id,
			}),
		},
		transactions: {
			customer: r.one.customers({
				from: r.transactions.customerId,
				to: r.customers.id,
			}),
			location: r.one.locations({
				from: r.transactions.locationId,
				to: r.locations.id,
			}),
			orderLines: r.many.orderLines(),
		},
	}),
)
