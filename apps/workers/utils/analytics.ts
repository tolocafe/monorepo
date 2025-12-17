import crypto from 'node:crypto'

import {
	captureEvent,
	captureException,
	getCurrentScope,
} from '@sentry/cloudflare'
import { getConnInfo } from 'hono/cloudflare-workers'
import z from 'zod/v4'

import type { Context } from 'hono'

import type {
	ServerAnalyticsEvent,
	ServerEventProperties,
} from '~common/analytics'

import type { Bindings } from '../types'

export async function trackServerEvent(
	context: Context<{ Bindings: Bindings }>,
	{
		eventName,
		eventParams: eventParameters = {},
		userData,
		userId,
	}: {
		eventName: ServerAnalyticsEvent
		eventParams?: ServerEventProperties
		userData?: Parameters<typeof getUserData>[0]
		userId: string
	},
) {
	try {
		const body = {
			client_id: generateGA4ClientId(userId),
			events: [
				{
					name: eventName,
					params: eventParameters,
				},
			],
			ip_override: getConnInfo(context).remote.address,
			user_agent: context.req.header('User-Agent'),
			user_data: getUserData(userData),
			user_id: userId,
		} as const

		getCurrentScope().setExtra('Analytics Body', body)

		const response = await fetch(
			`https://www.google-analytics.com/mp/collect?${new URLSearchParams({
				api_secret: context.env.GA4_API_SECRET,
				measurement_id: context.env.GA4_MEASUREMENT_ID,
			}).toString()}`,
			{
				body: JSON.stringify(body),
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			},
		)

		if (!response.ok) {
			throw new Error(`Analytics request failed: ${response.status}`)
		}

		const responseText = await response.text()

		getCurrentScope().setExtra('Analytics Response', responseText)

		captureEvent({
			level: 'debug',
			message: 'Analytics successfully sent',
		})
	} catch (error) {
		captureException(error)
	}
}

function generateGA4ClientId(userId: string): string {
	// See https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=js#client_id_limitations
	const timestamp = Math.floor(Date.now() / 1000)
	const random = Math.floor(Math.random() * 2_147_483_647)
	return `${timestamp}.${random}.${userId}`
}

const nameSha256Schema = z
	.string()
	.trim()
	.toLowerCase()
	.transform(hash256)
	.optional()
const emailSha256Schema = z
	.string()
	.trim()
	.toLowerCase()
	.transform(hash256)
	.optional()
const phoneSha256Schema = z.string().trim().transform(hash256).optional()

function getUserData(
	userData:
		| undefined
		| {
				address?: {
					postalCode?: string
				}
				emailAddress?: string
				firstName?: string
				lastName?: string
				phoneNumber?: string
		  },
) {
	return {
		address: {
			postal_code: userData?.address?.postalCode,
			sha256_first_name: nameSha256Schema.safeParse(userData?.firstName),
			sha256_last_name: nameSha256Schema.safeParse(userData?.lastName),
		},
		sha256_email_address: emailSha256Schema.safeParse(userData?.emailAddress),
		sha256_phone_number: phoneSha256Schema.safeParse(userData?.phoneNumber),
	}
}

function hash256(value: string) {
	return crypto.createHash('sha256').update(value).digest('hex')
}
