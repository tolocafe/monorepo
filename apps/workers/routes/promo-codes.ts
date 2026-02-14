import {
	CreatePromoCodeSchema,
	RedeemPromoCodeSchema,
} from '@tolo/common/schemas'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import type { Bindings } from '@/types'
import { notifyApplePassUpdate } from '@/utils/apns'
import { TEAM_GROUP_IDS } from '@/utils/constants'
import { notifyGooglePassUpdate } from '@/utils/generate-google-pass'
import { authenticate } from '@/utils/jwt'
import { posterApi } from '@/utils/poster'
import { trackEvent } from '@/utils/posthog'
import {
	createPromoCode,
	ensurePromoCodesTable,
	formatPromoCode,
	getPromoCode,
	normalizePromoCode,
	redeemPromoCode,
	unredeemPromoCode,
} from '@/utils/promo-codes'

const promoCodes = new Hono<{ Bindings: Bindings }>()
	// Create promo code (team-only)
	.post('/', async (context) => {
		const [authClientId] = await authenticate(context, context.env.JWT_SECRET)

		const authClient = await posterApi.clients.getClientById(
			context.env.POSTER_TOKEN,
			authClientId,
		)

		if (
			!authClient?.client_groups_id ||
			!TEAM_GROUP_IDS.has(authClient.client_groups_id)
		) {
			throw new HTTPException(403, { message: 'Access denied' })
		}

		const body = CreatePromoCodeSchema.parse(
			(await context.req.json()) as unknown,
		)

		await ensurePromoCodesTable(context.env.D1_TOLO)
		const result = await createPromoCode(
			context.env.D1_TOLO,
			body.amount,
			authClientId,
		)

		void trackEvent(context, {
			distinctId: authClientId.toString(),
			event: 'promo_code:create',
			properties: { amount: body.amount },
		})

		return context.json(result)
	})
	// Preview promo code (authenticated)
	.get('/:code', async (context) => {
		await authenticate(context, context.env.JWT_SECRET)

		const code = normalizePromoCode(context.req.param('code'))
		await ensurePromoCodesTable(context.env.D1_TOLO)
		const promoCode = await getPromoCode(context.env.D1_TOLO, code)

		if (!promoCode) {
			throw new HTTPException(404, { message: 'Promo code not found' })
		}

		return context.json({
			amount: promoCode.amount,
			code: formatPromoCode(promoCode.code),
			isRedeemed: Boolean(promoCode.redeemed_by),
		})
	})
	// Redeem promo code to e-wallet (authenticated)
	.post('/redeem', async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)

		const body = RedeemPromoCodeSchema.parse(
			(await context.req.json()) as unknown,
		)
		const code = normalizePromoCode(body.code)

		await ensurePromoCodesTable(context.env.D1_TOLO)

		// Check if code exists first
		const existing = await getPromoCode(context.env.D1_TOLO, code)
		if (!existing) {
			throw new HTTPException(404, { message: 'Promo code not found' })
		}
		if (existing.redeemed_by) {
			throw new HTTPException(400, {
				message: 'Promo code already redeemed',
			})
		}

		// Atomically mark as redeemed
		const redeemed = await redeemPromoCode(context.env.D1_TOLO, code, clientId)

		if (!redeemed) {
			throw new HTTPException(400, {
				message: 'Promo code already redeemed',
			})
		}

		// Credit e-wallet via Poster API
		try {
			await posterApi.clients.addEWalletPayment(context.env.POSTER_TOKEN, {
				amount: redeemed.amount,
				client_id: clientId,
				type: 1,
			})
		} catch {
			// Rollback redemption if Poster API fails
			await unredeemPromoCode(context.env.D1_TOLO, code)
			throw new HTTPException(500, {
				message: 'Failed to credit e-wallet. Please try again.',
			})
		}

		// Notify wallet pass updates and track analytics
		void Promise.allSettled([
			notifyApplePassUpdate(clientId, context.env.D1_TOLO, context.env),
			notifyGooglePassUpdate(clientId, context.env.D1_TOLO, context.env),
			trackEvent(context, {
				distinctId: clientId.toString(),
				event: 'promo_code:redeem',
				properties: { amount: redeemed.amount },
			}),
		])

		return context.json({
			amount: redeemed.amount,
			code: formatPromoCode(redeemed.code),
			message: 'Promo code redeemed',
		})
	})

export default promoCodes
