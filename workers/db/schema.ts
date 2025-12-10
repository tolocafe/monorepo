import { relations, sql } from 'drizzle-orm'
import {
	boolean,
	integer,
	pgSchema,
	primaryKey,
	text,
} from 'drizzle-orm/pg-core'

const tolo = pgSchema('tolo')

// ============================================================================
// Tables
// ============================================================================

export const syncState = tolo.table('sync_state', {
	cursor: text('cursor'),
	id: text('id').primaryKey(),
	lastTransactionDate: text('last_transaction_date'),
	lastTransactionId: integer('last_transaction_id'),
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
// Relations (for query builder with eager loading)
// ============================================================================

export const clientGroupsRelations = relations(clientGroups, ({ many }) => ({
	customers: many(customers),
}))

export const customersRelations = relations(customers, ({ many, one }) => ({
	clientGroup: one(clientGroups, {
		fields: [customers.clientGroupId],
		references: [clientGroups.id],
	}),
	transactions: many(transactions),
}))

export const locationsRelations = relations(locations, ({ many }) => ({
	transactions: many(transactions),
}))

export const menuCategoriesRelations = relations(
	menuCategories,
	({ many, one }) => ({
		children: many(menuCategories, { relationName: 'parentChild' }),
		parent: one(menuCategories, {
			fields: [menuCategories.parentId],
			references: [menuCategories.id],
			relationName: 'parentChild',
		}),
		products: many(products),
	}),
)

export const productsRelations = relations(products, ({ many, one }) => ({
	dishes: many(dishes),
	menuCategory: one(menuCategories, {
		fields: [products.menuCategoryId],
		references: [menuCategories.id],
	}),
	modifierGroups: many(productModifierGroups),
	modifiers: many(productModifiers),
	orderLines: many(orderLines),
	productIngredients: many(productIngredients),
}))

export const productModifierGroupsRelations = relations(
	productModifierGroups,
	({ many, one }) => ({
		modifiers: many(productModifiers),
		product: one(products, {
			fields: [productModifierGroups.productId],
			references: [products.id],
		}),
	}),
)

export const productModifiersRelations = relations(
	productModifiers,
	({ many, one }) => ({
		group: one(productModifierGroups, {
			fields: [productModifiers.groupId],
			references: [productModifierGroups.id],
		}),
		product: one(products, {
			fields: [productModifiers.productId],
			references: [products.id],
		}),
		transactionModifiers: many(transactionProductModifiers),
	}),
)

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
	productIngredients: many(productIngredients),
}))

export const dishesRelations = relations(dishes, ({ one }) => ({
	product: one(products, {
		fields: [dishes.productId],
		references: [products.id],
	}),
}))

export const productIngredientsRelations = relations(
	productIngredients,
	({ one }) => ({
		ingredient: one(ingredients, {
			fields: [productIngredients.ingredientId],
			references: [ingredients.id],
		}),
		product: one(products, {
			fields: [productIngredients.productId],
			references: [products.id],
		}),
	}),
)

export const transactionsRelations = relations(
	transactions,
	({ many, one }) => ({
		customer: one(customers, {
			fields: [transactions.customerId],
			references: [customers.id],
		}),
		location: one(locations, {
			fields: [transactions.locationId],
			references: [locations.id],
		}),
		orderLines: many(orderLines),
	}),
)

export const orderLinesRelations = relations(orderLines, ({ many, one }) => ({
	modifiers: many(transactionProductModifiers),
	product: one(products, {
		fields: [orderLines.productId],
		references: [products.id],
	}),
	transaction: one(transactions, {
		fields: [orderLines.transactionId],
		references: [transactions.id],
	}),
}))

export const transactionProductModifiersRelations = relations(
	transactionProductModifiers,
	({ one }) => ({
		modifier: one(productModifiers, {
			fields: [transactionProductModifiers.modifierId],
			references: [productModifiers.id],
		}),
		orderLine: one(orderLines, {
			fields: [
				transactionProductModifiers.transactionId,
				transactionProductModifiers.lineIndex,
			],
			references: [orderLines.transactionId, orderLines.lineIndex],
		}),
		transaction: one(transactions, {
			fields: [transactionProductModifiers.transactionId],
			references: [transactions.id],
		}),
	}),
)
