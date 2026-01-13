import { captureException } from '@sentry/cloudflare'
import { eq } from 'drizzle-orm'

import type { PosterIngredient } from '~common/api'
import {
	clientGroups,
	customers,
	ingredients,
	locations,
	menuCategories,
	productModifiers,
} from '~workers/db/schema'
import { posterApi } from '~workers/utils/poster'

import { mapClient } from './maps'
import type { Database } from './transactions'

export type Cache = {
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
 * Create empty caches for entity existence checks
 */
export function createCaches(): Cache {
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

/**
 * Ensure a category exists in the database
 */
export async function ensureCategory(
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
		const categories = await posterApi.menu.getMenuCategories(token)
		foundCategory = categories.find(
			(category) => Number(category.category_id) === id,
		)
	} catch (error) {
		captureException(error, {
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
				? Number(foundCategory.parent_category)
				: null,
			sortOrder: Number(foundCategory.sort_order),
			tag: foundCategory.category_tag ?? null,
			taxId: Number(foundCategory.tax_id),
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

/**
 * Ensure a client group exists in the database
 */
export async function ensureClientGroup(
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

/**
 * Ensure a customer exists in the database
 */
export async function ensureCustomer(
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

	const payload = await posterApi.clients.getClientById(token, id)
	const clientGroupId =
		payload?.client_groups_id && payload.client_groups_id !== '0'
			? Number(payload.client_groups_id)
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

/**
 * Ensure an ingredient exists in the database
 */
export async function ensureIngredient(
	database: Database,
	ingredient: PosterIngredient,
	cache: Cache,
) {
	const id = Number(ingredient.ingredient_id)
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

/**
 * Ensure a location exists in the database
 */
export async function ensureLocation(
	database: Database,
	id: number,
	cache: Cache,
) {
	if (cache.locations.has(id)) return

	await database.insert(locations).values({ id }).onConflictDoNothing()

	cache.locations.add(id)
}

/**
 * Ensure a modifier exists in the database
 */
export async function ensureModifier(
	database: Database,
	id: number,
	cache: Cache,
) {
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

export { ensureProduct } from './product-operations'
