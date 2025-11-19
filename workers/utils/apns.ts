import { captureException } from '@sentry/cloudflare'
import { SignJWT } from 'jose'

import type { Bindings } from '../types'

const APNS_PRODUCTION_URL = 'https://api.push.apple.com'

// Use production APNs for production environment
const getAPNsURL = () => APNS_PRODUCTION_URL

/**
 * Send Apple Wallet Pass update notifications for a client
 * This triggers devices to fetch the updated pass from the server
 * Call this whenever the client's wallet balance or transaction data changes
 */
export async function notifyPassUpdate(
	clientId: number,
	database: D1Database,
	environment: Bindings,
): Promise<{ deviceCount: number; failed: number; successful: number }> {
	try {
		const serialNumber = `TOLO-${clientId.toString().padStart(8, '0')}`

		// Get all devices registered for this pass
		const { results: registrations } = await database
			.prepare(
				'SELECT push_token FROM pass_registrations WHERE serial_number = ?',
			)
			.bind(serialNumber)
			.all<{ push_token: string }>()

		if (registrations.length === 0) {
			return { deviceCount: 0, failed: 0, successful: 0 }
		}

		// Update the pass update timestamp
		await database
			.prepare(
				'INSERT OR REPLACE INTO pass_updates (serial_number, pass_type_identifier, client_id, last_updated) VALUES (?, ?, ?, ?)',
			)
			.bind(
				serialNumber,
				'pass.cafe.tolo.app',
				clientId,
				new Date().toISOString(),
			)
			.run()

		// Send push notifications to all registered devices via APNs
		const pushTokens = registrations.map((r) => r.push_token)
		const apnsResult = await sendBatchAPNsNotifications(pushTokens, environment)

		// Handle failed notifications (remove invalid tokens)
		if (apnsResult.failed > 0) {
			const invalidTokens = apnsResult.results
				.filter(
					(result) =>
						!result.success && result.error?.includes('BadDeviceToken'),
				)
				.map((result) => result.token)

			if (invalidTokens.length > 0) {
				// Remove invalid tokens from database
				for (const invalidToken of invalidTokens) {
					await database
						.prepare('DELETE FROM pass_registrations WHERE push_token = ?')
						.bind(invalidToken)
						.run()
				}
			}
		}

		return {
			deviceCount: registrations.length,
			failed: apnsResult.failed,
			successful: apnsResult.successful,
		}
	} catch (error) {
		captureException(error)
		throw error
	}
}

/**
 * Send push notification to APNs for PassKit updates
 * PassKit notifications must have empty payload
 */
export async function sendAPNsNotification(
	deviceToken: string,
	environment: Bindings,
): Promise<{ error?: string; status?: number; success: boolean }> {
	try {
		// Generate authentication JWT
		const jwtToken = await generateAPNsJWT(environment)

		// PassKit requires empty payload
		const payload = {}

		const response = await fetch(`${getAPNsURL()}/3/device/${deviceToken}`, {
			body: JSON.stringify(payload),
			headers: {
				'apns-push-type': 'background', // Background push for PassKit
				'apns-topic': 'pass.cafe.tolo.app', // Your pass type identifier
				authorization: `bearer ${jwtToken}`,
				'content-type': 'application/json',
			},
			method: 'POST',
		})

		if (response.ok) {
			return { status: response.status, success: true }
		}

		// Handle APNs error responses
		const errorText = await response.text()
		return {
			error: errorText || 'Unknown APNs error',
			status: response.status,
			success: false,
		}
	} catch (error) {
		captureException(error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			success: false,
		}
	}
}

/**
 * Send push notifications to multiple devices
 * Handles batch processing and error reporting
 */
export async function sendBatchAPNsNotifications(
	deviceTokens: string[],
	environment: Bindings,
): Promise<{
	failed: number
	results: { error?: string; success: boolean; token: string }[]
	successful: number
}> {
	const results = await Promise.allSettled(
		deviceTokens.map(async (token) => {
			const result = await sendAPNsNotification(token, environment)
			return {
				error: result.error,
				status: result.status,
				success: result.success,
				token,
			}
		}),
	)

	let successful = 0
	let failed = 0
	const processedResults: {
		error?: string
		success: boolean
		token: string
	}[] = []

	for (const result of results) {
		if (result.status === 'fulfilled') {
			const { error, success, token } = result.value
			processedResults.push({ error, success, token })

			if (success) {
				successful++
			} else {
				failed++
			}
		} else {
			// Promise was rejected
			failed++
			processedResults.push({
				error:
					result.reason instanceof Error
						? result.reason.message
						: 'Unknown error',
				success: false,
				token: 'unknown',
			})
		}
	}

	return {
		failed,
		results: processedResults,
		successful,
	}
}

/**
 * Generate APNs JWT token for authentication
 * APNs requires JWT tokens signed with ES256 algorithm
 */
async function generateAPNsJWT(environment: Bindings): Promise<string> {
	try {
		// Parse the private key (should be in PEM format)
		const privateKeyPem = environment.APNS_PRIVATE_KEY.replaceAll(
			String.raw`\n`,
			'\n',
		)
		const privateKeyBytes = pemToBytes(privateKeyPem)

		// Import the private key for ES256 signing
		const privateKey = await crypto.subtle.importKey(
			'pkcs8',
			privateKeyBytes as BufferSource,
			{
				name: 'ECDSA',
				namedCurve: 'P-256',
			},
			false,
			['sign'],
		)

		// Create JWT with required claims
		const jwt = new SignJWT({})
			.setProtectedHeader({
				alg: 'ES256',
				kid: environment.APNS_KEY_ID, // Key ID from Apple Developer account
			})
			.setIssuer(environment.APNS_TEAM_ID) // Team ID from Apple Developer account
			.setIssuedAt()
			.setExpirationTime('1h') // APNs tokens expire after 1 hour

		return await jwt.sign(privateKey)
	} catch (error) {
		captureException(error)
		throw new Error(
			`Failed to generate APNs JWT: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Convert PEM format private key to raw bytes
 */
function pemToBytes(pem: string): Uint8Array {
	// Remove PEM headers and whitespace
	const base64 = pem
		.replace(/-----BEGIN PRIVATE KEY-----/, '')
		.replace(/-----END PRIVATE KEY-----/, '')
		.replaceAll(/\s/g, '')

	// Convert base64 to bytes
	const binaryString = atob(base64)
	const bytes = new Uint8Array(binaryString.length)
	for (let index = 0; index < binaryString.length; index++) {
		bytes[index] = binaryString.codePointAt(index) as number
	}
	return bytes
}
