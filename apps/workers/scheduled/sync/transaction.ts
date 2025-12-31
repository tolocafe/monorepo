import { eq } from 'drizzle-orm'

import type { DashTransaction } from '~common/api'
import { transactions } from '~workers/db/schema'

import { ensureCustomer, ensureLocation } from './ensure'
import type { Cache } from './ensure'
import type { TransactionChange } from './events'
import type { Database } from './transactions'
import { upsertOrderLines } from './upsert'
import { toCents, toISO } from './utils'

/**
 * Check if transaction history contains "order accepted" event
 * In Poster, accepting an order adds a changeorderstatus entry with value: 1
 */
function isOrderAccepted(tx: DashTransaction): boolean {
	if (!tx.history) return false
	return tx.history.some(
		(entry) =>
			entry.type_history === 'changeorderstatus' && entry.value === '1',
	)
}

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
	const txId = Number(tx.transaction_id)

	const existing = await database
		.select()
		.from(transactions)
		.where(eq(transactions.id, txId))
		.then((rows) => rows.at(0))

	const customerId =
		tx.client_id && tx.client_id !== '0' ? Number(tx.client_id) : null
	if (customerId) {
		await ensureCustomer(database, token, customerId, cache)
	}

	const locationId = tx.spot_id ? Number(tx.spot_id) : null
	if (locationId) {
		await ensureLocation(database, locationId, cache)
	}

	// Check if order has been accepted via Poster POS
	const isAccepted = isOrderAccepted(tx)

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
		isAccepted,
		locationId,
		payedBonus: tx.payed_bonus ? toCents(tx.payed_bonus) : null,
		payedCard: tx.payed_card ? toCents(tx.payed_card) : null,
		payedCash: tx.payed_cash ? toCents(tx.payed_cash) : null,
		payedCert: tx.payed_cert ? toCents(tx.payed_cert) : null,
		payedSum: toCents(tx.payed_sum),
		payedThirdParty: tx.payed_third_party
			? toCents(tx.payed_third_party)
			: null,
		payType: tx.pay_type ? Number(tx.pay_type) : null,
		processingStatus: Number(tx.processing_status),
		reason: tx.reason ? Number(tx.reason) : null,
		roundSum: tx.round_sum ? toCents(tx.round_sum) : null,
		serviceMode: tx.service_mode ? Number(tx.service_mode) : null,
		status: Number(tx.status),
		sum: tx.sum ? toCents(tx.sum) : null,
		syncedAt: new Date().toISOString(),
		tableId: tx.table_id ? Number(tx.table_id) : null,
		tipSum: tx.tip_sum ? toCents(tx.tip_sum) : null,
		// type: 0 = Sale, 1 = Return. Default to 0 (Sale) if undefined
		type: tx.type === undefined ? 0 : Number(tx.type),
		updatedAt: new Date().toISOString(),
		userId: tx.user_id ?? null,
	}

	await database.insert(transactions).values(payload).onConflictDoUpdate({
		set: payload,
		target: transactions.id,
	})

	// Insert order lines AFTER transaction (due to foreign key constraint)
	await upsertOrderLines(database, token, tx, cache)

	// Calculate actual income (card + cash + third-party, excludes eWallet/bonus)
	const incomeAmount =
		(payload.payedCard ?? 0) +
		(payload.payedCash ?? 0) +
		(payload.payedThirdParty ?? 0)

	// Return change information for event processing
	return {
		action: existing ? 'updated' : 'created',
		customerId,
		dateClose: payload.dateClose,
		dateStart: tx.date_start,
		incomeAmount,
		isAccepted,
		oldDateClose: existing?.dateClose ?? null,
		oldIsAccepted: existing?.isAccepted ?? false,
		oldProcessingStatus: existing?.processingStatus,
		oldStatus: existing?.status,
		payedSum: payload.payedSum,
		processingStatus: payload.processingStatus,
		serviceMode: payload.serviceMode,
		status: payload.status,
		transactionId: txId,
	}
}
