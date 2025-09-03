import crypto from 'node:crypto'

import {
	captureEvent,
	captureException,
	getCurrentScope,
} from '@sentry/cloudflare'
import { getConnInfo } from 'hono/cloudflare-workers'

import type {
	ServerAnalyticsEvent,
	ServerEventProperties,
} from '@common/analytics'
import type { Context } from 'hono'

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

function getUserData(userData?: {
	emailAddress?: string
	firstName?: string
	lastName?: string
	phoneNumber?: string
}) {
	return {
		email_address: userData?.emailAddress
			? hash256(userData.emailAddress)
			: undefined,
		first_name: userData?.firstName ? hash256(userData.firstName) : undefined,
		last_name: userData?.lastName ? hash256(userData.lastName) : undefined,
		phone_number: userData?.phoneNumber
			? hash256(userData.phoneNumber)
			: undefined,
	}
}

function hash256(value: string) {
	return crypto.createHash('sha256').update(value).digest('hex')
}
