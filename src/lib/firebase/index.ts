import { firebase } from '@react-native-firebase/analytics'
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto'

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
	await Promise.allSettled([
		firebase.analytics().setAnalyticsCollectionEnabled(true),
		firebase.analytics().setConsent({
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

	await Promise.allSettled([
		userId ? firebase.analytics().setUserId(userId) : null,
		firebase.analytics().setUserProperties({
			sha256_email_address: emailAddressHash ?? null,
			sha256_first_name: firstNameHash ?? null,
			sha256_last_name: lastNameHash ?? null,
			sha256_phone_number: phoneNumberHash ?? null,
		}),
	])
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
