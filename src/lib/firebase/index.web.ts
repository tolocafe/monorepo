import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto'
import {
	getAnalytics,
	setAnalyticsCollectionEnabled,
	setConsent,
	setUserId,
	setUserProperties,
} from 'firebase/analytics'

import { requestTrackingPermissionAsync } from '@/lib/notifications'

import type { AnalyticsEvent, EventProperties } from './utils'

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
	try {
		const analytics = getAnalytics()

		setAnalyticsCollectionEnabled(analytics, true)
		setConsent({
			ad_personalization: 'granted',
			ad_storage: 'granted',
			ad_user_data: 'granted',
			analytics_storage: 'granted',
		})

		const [emailAddressHash, firstNameHash, lastNameHash, phoneNumberHash] =
			await Promise.all([
				email ? hash256(email, 'email') : null,
				firstName ? hash256(firstName) : null,
				lastName ? hash256(lastName) : null,
				phoneNumber ? hash256(phoneNumber, 'phone') : null,
			])

		if (userId) {
			setUserId(analytics, userId)
		}

		setUserProperties(analytics, {
			sha256_email_address: emailAddressHash ?? null,
			sha256_first_name: firstNameHash ?? null,
			sha256_last_name: lastNameHash ?? null,
			sha256_phone_number: phoneNumberHash ?? null,
		})
	} catch {
		return
	}
}

export function hash256(value: string, type?: 'email' | 'phone') {
	try {
		const algorithm = CryptoDigestAlgorithm.SHA256

		if (type === 'email') {
			return digestStringAsync(algorithm, value.toLowerCase())
		}
		if (type === 'phone') {
			return digestStringAsync(algorithm, `+${value.replaceAll(/\D/g, '')}`)
		}

		return digestStringAsync(algorithm, value)
	} catch {
		return null
	}
}

export async function trackEvent(
	event: AnalyticsEvent,
	properties?: EventProperties,
) {
	const trackingEnabled = await requestTrackingPermissionAsync()
	if (!trackingEnabled) return

	void trackEvent(event, properties)
}
