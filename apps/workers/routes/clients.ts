import type { RedeemClientData } from '@tolo/common/api'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod/v4'

import type { Bindings } from '@/types'
import { notifyApplePassUpdate } from '@/utils/apns'
import { TEAM_GROUP_IDS } from '@/utils/constants'
import { notifyGooglePassUpdate } from '@/utils/generate-google-pass'
import { authenticate } from '@/utils/jwt'
import { posterApi } from '@/utils/poster'
import { notifyRedemption } from '@/utils/push-notifications'
import {
	canRedeemBirthdayDrink,
	createRedemption,
	getCustomerStamps,
	STAMPS_PER_REDEMPTION,
} from '@/utils/stamps'

const updateClientSchema = z.object({
	birthday: z.string().optional(),
	bonus: z.number().optional(),
	card_number: z.string().optional(),
	client_groups_id_client: z.number().optional(),
	client_name: z.string().optional(),
	client_sex: z.number().optional(),
	discount_per: z.number().optional(),
	email: z.string().optional(),
})

const pushTokensSchema = z.string().max(255).min(1)

const clients = new Hono<{ Bindings: Bindings }>()
	// Get client by ID (team members and owners only)
	.get('/:id', async (c) => {
		const [authClientId] = await authenticate(c, c.env.JWT_SECRET)

		// Verify user is a team member or owner
		const authClient = await posterApi.clients.getClientById(
			c.env.POSTER_TOKEN,
			authClientId,
		)

		if (
			!authClient?.client_groups_id ||
			!TEAM_GROUP_IDS.has(authClient.client_groups_id)
		) {
			throw new HTTPException(403, { message: 'Access denied' })
		}

		const id = c.req.param('id')
		if (!id) {
			throw new HTTPException(400, { message: 'Client ID required' })
		}

		const client = await posterApi.clients.getClientById(
			c.env.POSTER_TOKEN,
			Number(id),
		)

		if (!client) {
			throw new HTTPException(404, { message: 'Client not found' })
		}

		const clientTransactions = await posterApi.dash.getTransactions(
			c.env.POSTER_TOKEN,
			{
				date_from: '2025-01-01',
				id,
				status: '2',
				type: 'clients',
			},
		)

		const pointsData = await getCustomerStamps(
			c.env.D1_TOLO,
			Number(id),
			clientTransactions.length,
		)

		// Check if customer can redeem birthday drink
		const canRedeemBirthday = await canRedeemBirthdayDrink(
			c.env.D1_TOLO,
			Number(id),
			client.birthday,
		)

		// Return only essential information for redemption verification
		return c.json<RedeemClientData>({
			birthday: client.birthday,
			canRedeemBirthday,
			client_groups_name: client.client_groups_name,
			client_id: client.client_id,
			firstname: client.firstname,
			lastname: client.lastname,
			phone: client.phone,
			stamps: pointsData.stamps,
		})
	})
	// Create a redemption (team members and owners only)
	.post('/:id/redeem', async (c) => {
		const [authClientId] = await authenticate(c, c.env.JWT_SECRET)

		// Verify user is a team member or owner
		const authClient = await posterApi.clients.getClientById(
			c.env.POSTER_TOKEN,
			authClientId,
		)

		if (
			!authClient?.client_groups_id ||
			!TEAM_GROUP_IDS.has(authClient.client_groups_id)
		) {
			throw new HTTPException(403, { message: 'Access denied' })
		}

		const id = c.req.param('id')
		if (!id) {
			throw new HTTPException(400, { message: 'Client ID required' })
		}

		const bodyUnknown = (await c.req.json()) as unknown
		const body = z
			.object({
				type: z.enum(['birthday', 'visits']),
			})
			.parse(bodyUnknown)

		const clientId = Number(id)

		// Validate the redemption is allowed
		if (body.type === 'birthday') {
			const client = await posterApi.clients.getClientById(
				c.env.POSTER_TOKEN,
				clientId,
			)
			const canRedeem = await canRedeemBirthdayDrink(
				c.env.D1_TOLO,
				clientId,
				client?.birthday,
			)
			if (!canRedeem) {
				throw new HTTPException(400, {
					message: 'Birthday drink not available for this customer',
				})
			}
		} else {
			const clientTransactions = await posterApi.dash.getTransactions(
				c.env.POSTER_TOKEN,
				{
					date_from: '2025-01-01',
					id,
					status: '2',
					type: 'clients',
				},
			)
			const pointsData = await getCustomerStamps(
				c.env.D1_TOLO,
				clientId,
				clientTransactions.length,
			)
			if (pointsData.stamps < STAMPS_PER_REDEMPTION) {
				throw new HTTPException(400, {
					message: 'Not enough stamps for redemption',
				})
			}
		}

		// Create the redemption
		const redemption = await createRedemption(
			c.env.D1_TOLO,
			clientId,
			body.type,
			authClientId,
		)

		// Notify wallet providers and send push notification
		await Promise.allSettled([
			notifyApplePassUpdate(clientId, c.env.D1_TOLO, c.env),
			notifyGooglePassUpdate(clientId, c.env.D1_TOLO, c.env),
			notifyRedemption(clientId, c.env.D1_TOLO, body.type),
		])

		return c.json({
			message: 'Redemption successful',
			redemption,
		})
	})
	.put('/:id', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const id = c.req.param('id')

		if (!id || id !== clientId.toString()) {
			throw new HTTPException(403, { message: 'Forbidden' })
		}

		const bodyUnknown = (await c.req.json()) as unknown
		const body =
			typeof bodyUnknown === 'object' &&
			bodyUnknown !== null &&
			!Array.isArray(bodyUnknown)
				? (bodyUnknown as Record<string, unknown>)
				: {}

		const parsedBody = updateClientSchema.parse(body)

		const posterClient = await posterApi.clients.updateClient(
			c.env.POSTER_TOKEN,
			Number(id),
			parsedBody,
		)

		return c.json(posterClient)
	})
	.put('/:id/push-tokens', async (c) => {
		const [clientId] = await authenticate(c, c.env.JWT_SECRET)

		const id = c.req.param('id')

		if (!id || id !== clientId.toString()) {
			throw new HTTPException(403, { message: 'Forbidden' })
		}

		const bodyUnknown = (await c.req.json()) as unknown
		const body = pushTokensSchema.parse(bodyUnknown)

		await c.env.D1_TOLO.exec(
			'CREATE TABLE IF NOT EXISTS push_tokens (client_id INTEGER, token TEXT, created_at TIMESTAMP, last_used TIMESTAMP, PRIMARY KEY (client_id, token))',
		)

		try {
			await c.env.D1_TOLO.prepare(
				'INSERT INTO push_tokens (client_id, token, created_at, last_used) VALUES (?, ?, ?, ?)',
			)
				.bind(id, body, new Date().toISOString(), new Date().toISOString())
				.run()
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes('UNIQUE constraint failed')
			) {
				return c.json({ error: 'Token already exists' }, 400)
			}

			throw error
		}

		return c.json({ success: true })
	})

export default clients
