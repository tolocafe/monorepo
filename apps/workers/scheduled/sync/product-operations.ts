import * as Sentry from '@sentry/cloudflare'
import { eq } from 'drizzle-orm'

import type { Product as PosterProduct } from '~common/api'
import {
	dishes,
	productIngredients,
	productModifierGroups,
	products,
} from '~workers/db/schema'
import { api } from '~workers/utils/poster'

import { ensureCategory, ensureIngredient } from './ensure'
import type { Cache } from './ensure'
import { mapModifierGroup, mapProduct } from './maps'
import type { Database } from './transactions'
import { upsertModifier } from './upsert'

/**
 * Ensure a product exists in the database and sync all related entities
 */
export async function ensureProduct(
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
			Number(product.menu_category_id),
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
 * Upsert a dish for a product
 */
export async function upsertDish(database: Database, product: PosterProduct) {
	const id = Number(product.product_id)
	const payload = {
		cookingTime: product.cooking_time || null,
		id,
		netWeight: product.weight_flag ? Number(product.weight_flag) : null,
		productId: id,
		workshop: product.workshop || null,
	} satisfies typeof dishes.$inferInsert

	await database.insert(dishes).values(payload).onConflictDoUpdate({
		set: payload,
		target: dishes.id,
	})
}

/**
 * Upsert product ingredients
 */
export async function upsertProductIngredients(
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
				ingredientId: Number(ingredient.ingredient_id),
				productId: Number(product.product_id),
				quantity: ingredient.ingredient_weight || null,
			})
			.onConflictDoUpdate({
				set: {
					quantity: ingredient.ingredient_weight || null,
				},
				target: [productIngredients.productId, productIngredients.ingredientId],
			})
	}
}

/**
 * Upsert product modifiers and modifier groups
 */
export async function upsertProductModifiers(
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
}
