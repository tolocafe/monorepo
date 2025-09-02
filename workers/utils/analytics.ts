import crypto from 'node:crypto'

import { captureEvent, captureException } from '@sentry/cloudflare'

import type {
	ServerAnalyticsEvent,
	ServerEventProperties,
} from '@common/analytics'

import type { Bindings } from '../types'

export async function trackServerEvent(
	environment: Bindings,
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
		const response = await fetch(
			`https://www.google-analytics.com/mp/collect?measurement_id=${environment.GA4_MEASUREMENT_ID}&api_secret=${environment.GA4_API_SECRET}`,
			{
				body: JSON.stringify({
					client_id: generateGA4ClientId(),
					events: [
						{
							name: eventName,
							params: eventParameters,
							user_data: getUserData(userData),
						},
					],
					user_id: userId,
				}),
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			},
		)

		if (!response.ok) {
			throw new Error(`Analytics request failed: ${response.status}`)
		}

		captureEvent({
			extra: { data: await response.json() },
			level: 'debug',
			message: 'Analytics request',
		})
	} catch (error) {
		captureException(error)
	}
}

function generateGA4ClientId(): string {
	const timestamp = Math.floor(Date.now() / 1000)
	const random = Math.floor(Math.random() * 2_147_483_647)
	return `${timestamp}.${random}`
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
