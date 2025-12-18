import { desc, eq } from 'drizzle-orm'

import {
	orderLines,
	productModifiers,
	transactionProductModifiers,
} from '~workers/db/schema'

import type { DashTransaction, PosterModification } from '~common/api'

import { ensureCategory, ensureModifier, ensureProduct } from './ensure'
import { toCents } from './utils'

import type { Cache } from './ensure'
import type { Database } from './transactions'

/**
 * Upsert line modifiers for a transaction order line
 */
export async function upsertLineModifiers(
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
				name: module_.modification_name || null,
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

/**
 * Upsert a modifier record
 */
export async function upsertModifier(
	database: Database,
	module_: PosterModification,
	productId: string,
	groupId: null | number,
	cache: Cache,
) {
	const id = module_.dish_modification_id
	if (!Number.isFinite(id) || id <= 0) return
	if (cache.modifiers.has(id)) return

	const safeName = module_.modificator_name.trim() || `modifier-${id}`
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

/**
 * Upsert order lines for a transaction
 */
export async function upsertOrderLines(
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

/**
 * Find modifier ID by name
 */
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
