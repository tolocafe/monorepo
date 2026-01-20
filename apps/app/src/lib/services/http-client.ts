import * as SecureStore from 'expo-secure-store'
import ky from 'ky'

import { BASE_URL } from '@/lib/api'
import { STORAGE_KEYS } from '@/lib/constants/storage'
import { getCurrentLocale } from '@/lib/locales/init'
import { isWeb } from '@/lib/utils/device'

/**
 * Gets the current auth token from platform-appropriate storage
 * - Web: returns null (auth handled via HttpOnly cookie)
 * - Native: reads token from SecureStore
 */
export async function getAuthToken(): Promise<null | string> {
	if (isWeb) return null
	try {
		const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_SESSION)
		return token ?? null
	} catch {
		return null
	}
}

/**
 * Public HTTP client - no authentication required
 * Use for endpoints that don't require user authentication
 */
export const publicClient = ky.create({
	credentials: 'include',
	headers: { 'Content-Type': 'application/json' },
	hooks: {
		afterResponse: [
			async (request, _options, response) => {
				if (isWeb) {
					if (__DEV__) {
						// eslint-disable-next-line no-console
						console.log('Web environment, not saving token to SecureStore')
					}
					return response
				}

				try {
					const isVerifyOtpEndpoint = request.url.includes('/auth/verify-otp')

					if (isVerifyOtpEndpoint) {
						const data = (await response
							.clone()
							.json()
							.catch(() => null)) as null | { token: string }

						const token: unknown = data?.token

						if (typeof token === 'string' && token.length > 0) {
							await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_SESSION, token)
						}
					}
				} catch {
					// noop
				}

				return response
			},
		],
		beforeRequest: [
			(request) => {
				const locale = getCurrentLocale()
				if (locale) request.headers.set('Accept-Language', locale)
			},
		],
	},
	prefixUrl: `${BASE_URL}/api`,
})

/**
 * Private HTTP client - automatic auth token injection
 * Use for endpoints that require user authentication
 */
export const privateClient = ky.create({
	credentials: 'include',
	headers: {
		'Content-Type': 'application/json',
	},
	hooks: {
		beforeRequest: [
			async (request) => {
				const locale = getCurrentLocale()
				if (locale) request.headers.set('Accept-Language', locale)

				// Web uses HttpOnly cookie; native uses Authorization header
				if (isWeb) return request

				const token = await getAuthToken()

				if (!token) throw new Error('No auth token found')

				request.headers.set('Authorization', `Bearer ${token}`)

				return request
			},
		],
	},
	prefixUrl: `${BASE_URL}/api`,
})
