import {
	getAnalytics,
	logEvent,
	setAnalyticsCollectionEnabled,
	setConsent,
	setUserId,
	setUserProperties,
} from '@react-native-firebase/analytics'
import { captureException } from '@sentry/react-native'
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto'

import { requestTrackingPermissionAsync } from '@/lib/notifications'

import type { AnalyticsEvent, EventProperties } from './utils'

const algorithm = CryptoDigestAlgorithm.SHA256

export async function enableAnalytics({
	email,
	firstName,
	lastName,
	phoneNumber,
	userId,
}: {
	email?: string
	firstName?: string
	lastName?: string
	phoneNumber?: string
	userId?: string
}) {
	const analytics = getAnalytics()

	try {
		await Promise.all([
			setAnalyticsCollectionEnabled(analytics, true),
			setConsent(analytics, {
				ad_personalization: true,
				ad_storage: true,
				ad_user_data: true,
				analytics_storage: true,
			}),
		])

		const [emailAddressHash, firstNameHash, lastNameHash, phoneNumberHash] =
			await Promise.all([
				email ? hash256(email, 'email') : null,
				firstName ? hash256(firstName) : null,
				lastName ? hash256(lastName) : null,
				phoneNumber ? hash256(phoneNumber, 'phone') : null,
			])

		await Promise.all([
			userId ? setUserId(analytics, userId) : null,
			setUserProperties(analytics, {
				sha256_email_address: emailAddressHash ?? null,
				sha256_first_name: firstNameHash ?? null,
				sha256_last_name: lastNameHash ?? null,
				sha256_phone_number: phoneNumberHash ?? null,
			}),
		])
	} catch (error) {
		captureException(error)
	}
}

export async function trackEvent(
	event: AnalyticsEvent,
	properties?: EventProperties,
) {
	const analytics = getAnalytics()

	try {
		const trackingEnabled = await requestTrackingPermissionAsync()

		if (!trackingEnabled) {
			return
		}

		// @ts-expect-error - event is a valid AnalyticsEvent
		void logEvent(analytics, event, properties)
	} catch (error) {
		captureException(error)
	}
}

function hash256(value: string, type?: 'email' | 'phone') {
	if (type === 'email') {
		return digestStringAsync(algorithm, value.toLowerCase())
	}
	if (type === 'phone') {
		return digestStringAsync(algorithm, `+${value.replaceAll(/\D/g, '')}`)
	}

	return digestStringAsync(algorithm, value)
}
