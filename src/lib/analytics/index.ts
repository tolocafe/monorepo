import * as Sentry from '@sentry/react-native'

import * as firebaseAnalytics from './firebase'
import { posthog } from './posthog'

import type { AnalyticsEvent, EventProperties } from './firebase/utils'

export type UserIdentity = {
	email?: string
	firstName?: string
	lastName?: string
	phoneNumber?: string
	userId?: string
}

export async function enableAnalytics() {
	try {
		await firebaseAnalytics.enableAnalytics()
	} catch (error) {
		Sentry.captureException(error)
	}
}

export async function flush() {
	try {
		await Promise.allSettled([posthog.flush(), Promise.resolve(Sentry.flush())])
	} catch (error) {
		Sentry.captureException(error)
	}
}

export async function identify(identity: UserIdentity) {
	const { email, firstName, lastName, phoneNumber, userId } = identity

	try {
		await enableAnalytics()

		const promises: Promise<unknown>[] = [
			firebaseAnalytics.identify({
				email,
				firstName,
				lastName,
				phoneNumber,
				userId,
			}),
		]

		if (userId) {
			const properties: Record<string, string> = {}
			if (email) properties.email = email
			if (firstName) properties.first_name = firstName
			if (lastName) properties.last_name = lastName
			if (phoneNumber) properties.phone = phoneNumber

			promises.push(Promise.resolve(posthog.identify(userId, properties)))
		}

		promises.push(
			Promise.resolve(
				Sentry.setUser({
					email: email ?? undefined,
					id: userId ?? undefined,
					username: firstName
						? `${firstName}${lastName ? ` ${lastName}` : ''}`
						: undefined,
				}),
			),
		)

		await Promise.allSettled(promises)
	} catch (error) {
		Sentry.captureException(error)
	}
}

export async function reset() {
	try {
		await Promise.allSettled([
			Promise.resolve(posthog.reset()),
			Promise.resolve(Sentry.setUser(null)),
		])
	} catch (error) {
		Sentry.captureException(error)
	}
}

export async function trackEvent(
	event: AnalyticsEvent,
	properties?: EventProperties,
) {
	try {
		await enableAnalytics()

		await Promise.allSettled([
			firebaseAnalytics.trackEvent(event, properties),
			Promise.resolve(posthog.capture(event, properties ?? {})),
		])
	} catch (error) {
		Sentry.captureException(error)
	}
}

export { type AnalyticsEvent, type EventProperties } from './firebase/utils'
