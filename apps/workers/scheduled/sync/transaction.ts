import { eq } from 'drizzle-orm'

import { transactions } from '~workers/db/schema'

import type { DashTransaction } from '~common/api'

import { ensureCustomer, ensureLocation } from './ensure'
import { upsertOrderLines } from './upsert'
import { toCents, toISO } from './utils'

import type { Cache } from './ensure'
import type { TransactionChange } from './events'
import type { Database } from './transactions'

/**
 * Upsert a transaction and return change information
 * Returns change details for event processing
 */
export async function upsertTransaction(
	context: {
		cache: Cache
		database: Database
		token: string
	},
	tx: DashTransaction,
): Promise<TransactionChange> {
	const { cache, database, token } = context
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
			(tx.date_create ? toISO(tx.date_create) : null) ||
			new Date().toISOString(),
		dateStart: tx.date_start ? (toISO(tx.date_start) ?? null) : null,
		discount: tx.discount || null,
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
		// type: 0 = Sale, 1 = Return. Default to 0 (Sale) if undefined
		type: tx.type === undefined ? 0 : Number.parseInt(String(tx.type), 10),
		updatedAt: new Date().toISOString(),
		userId: tx.user_id ?? null,
	}

	await database.insert(transactions).values(payload).onConflictDoUpdate({
		set: payload,
		target: transactions.id,
	})

	// Insert order lines AFTER transaction (due to foreign key constraint)
	await upsertOrderLines(database, token, tx, cache)

	// Return change information for event processing
	return {
		action: existing ? 'updated' : 'created',
		customerId,
		dateStart: tx.date_start,
		oldProcessingStatus: existing?.processingStatus,
		processingStatus: payload.processingStatus,
		serviceMode: payload.serviceMode,
		transactionId: txId,
	}
}
