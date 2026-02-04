/* eslint-disable unicorn/no-keyword-prefix */
import { captureException } from '@sentry/cloudflare'
import type { ClientData } from '@tolo/common'
import { JWT } from 'google-auth-library'
import type { Context } from 'hono'
import jwt from 'jsonwebtoken'

import type { Bindings } from '@/types'

import { STAMPS_PROGRAM_START_DATE } from './constants'
import { posterApi } from './poster'
import { countStampEligibleTransactions, getCustomerStamps } from './stamps'

const GOOGLE_WALLET_BASE_URL =
	'https://walletobjects.googleapis.com/walletobjects/v1' as const
const ISSUER_ID = '3388000000022990889' as const
const PASS_CLASS_ID = `${ISSUER_ID}.10.pass.cafe.tolo.app` as const

export default async function createGooglePass(
	context: Context<{ Bindings: Bindings }>,
	_passAuthToken: string,
	client: ClientData,
) {
	try {
		await getOrCreateLoyaltyClass({
			classId: PASS_CLASS_ID,
			context,
		})

		const loyaltyObject = await createLoyaltyObject({
			classId: PASS_CLASS_ID,
			client,
			context,
			issuerId: ISSUER_ID,
		})

		return loyaltyObject
	} catch (error) {
		captureException(error)
		throw error
	}
}

/**
 * Update Google Wallet loyalty object for a client
 * This directly updates the loyalty object via the Google Pay API
 * Call this whenever the client's points or transaction data changes
 */
export async function notifyGooglePassUpdate(
	clientId: number,
	database: D1Database,
	environment: Bindings,
): Promise<{ error?: string; success: boolean }> {
	const passId = `TOLO-${clientId.toString().padStart(8, '0')}`
	const objectId = `${ISSUER_ID}.0.${passId}`

	try {
		const client = await posterApi.clients.getClientById(
			environment.POSTER_TOKEN,
			clientId,
		)

		if (!client) {
			return { error: 'Client not found', success: false }
		}

		const transactionsCount = await posterApi.dash
			.getTransactions(environment.POSTER_TOKEN, {
				date_from: STAMPS_PROGRAM_START_DATE,
				id: clientId.toString(),
				status: '2',
				type: 'clients',
			})
			.then((transactions) => countStampEligibleTransactions(transactions))
			.catch(() => 0)

		const stampsData = await getCustomerStamps(
			database,
			clientId,
			transactionsCount,
		)

		const loyaltyObject = getLoyaltyObject({
			classId: PASS_CLASS_ID,
			client,
			objectId,
			passId,
			stamps: stampsData.stamps,
		})

		const googleClient = getGoogleClient({
			email: environment.GOOGLE_SERVICE_WALLET_EMAIL,
			key: formatPrivateKey(environment.GOOGLE_SERVICE_WALLET_PRIVATE_KEY),
		})

		await googleClient.request({
			data: loyaltyObject,
			method: 'PATCH',
			url: `${GOOGLE_WALLET_BASE_URL}/loyaltyObject/${objectId}`,
		})

		return { success: true }
	} catch (error) {
		// 404 means user hasn't added pass yet - not an error
		if (
			error instanceof Error &&
			'response' in error &&
			(error.response as { status: number }).status === 404
		) {
			return { error: 'Pass not found', success: false }
		}

		captureException(error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			success: false,
		}
	}
}

async function createLoyaltyObject({
	classId,
	client,
	context,
	issuerId,
}: {
	classId: string
	client: ClientData
	context: Context<{ Bindings: Bindings }>
	issuerId: string
}) {
	const passId = `TOLO-${client.client_id.padStart(8, '0')}`

	// Count only closed transactions (status: '2') from all time
	const transactionsCount = await posterApi.dash
		.getTransactions(context.env.POSTER_TOKEN, {
			date_from: STAMPS_PROGRAM_START_DATE,
			id: client.client_id,
			status: '2',
			type: 'clients',
		})
		.then((transactions) => countStampEligibleTransactions(transactions))
		.catch(() => 0)

	// Calculate stamps based on transactions and redemptions
	const stampsData = await getCustomerStamps(
		context.env.D1_TOLO,
		Number(client.client_id),
		transactionsCount,
	)

	const loyaltyObject = getLoyaltyObject({
		classId,
		client,
		objectId: `${issuerId}.0.${passId}`,
		passId,
		stamps: stampsData.stamps,
	})

	return jwt.sign(
		{
			aud: 'google',
			iss: context.env.GOOGLE_SERVICE_WALLET_EMAIL,
			origins: ['app.tolo.cafe'],
			payload: { loyaltyObjects: [loyaltyObject] },
			typ: 'savetowallet',
		},
		formatPrivateKey(context.env.GOOGLE_SERVICE_WALLET_PRIVATE_KEY),
		{ algorithm: 'RS256' },
	)
}

function formatPrivateKey(privateKey: string) {
	// eslint-disable-next-line unicorn/prefer-string-replace-all
	return privateKey.replace(/\\n/gm, '\n')
}

function getGoogleClient({ email, key }: { email: string; key: string }) {
	return new JWT({
		email,
		key,
		scopes: 'https://www.googleapis.com/auth/wallet_object.issuer',
	})
}

function getLoyaltyClass(classId: string) {
	return {
		accountIdLabel: 'ID de Miembro',
		accountNameLabel: 'Nombre',
		appLinkData: {
			androidAppLinkInfo: {
				appTarget: {
					targetUri: {
						packageName: 'cafe.tolo.app',
						uri: 'tolo://more/top-up',
					},
				},
			},
			iosAppLinkInfo: {
				appTarget: {
					targetUri: {
						packageName: 'cafe.tolo.app',
						uri: 'tolo://more/top-up',
					},
				},
			},
			webAppLinkInfo: {
				appTarget: {
					targetUri: {
						uri: 'https://app.tolo.cafe/more/top-up',
					},
				},
			},
		},
		enableSmartTap: true,
		hexBackgroundColor: '#3d6039',
		id: classId,
		issuerName: 'TOLO',
		linksModuleData: {
			uris: [
				{
					description: 'Recargar Saldo',
					id: 'top-up',
					uri: 'https://app.tolo.cafe/more/top-up',
				},
				{
					description: 'Ver Menú',
					id: 'menu',
					uri: 'https://app.tolo.cafe',
				},
			],
		},
		merchantLocations: [
			{
				latitude: 19.279_918,
				longitude: -99.648_828,
				name: 'TOLO - Pino Suárez, Toluca',
			},
		],
		multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
		programLogo: {
			contentDescription: {
				defaultValue: {
					language: 'en-US',
					value: 'TOLO',
				},
			},
			sourceUri: {
				uri: 'https://app.tolo.cafe/adaptive-icon.png',
			},
		},
		programName: 'TOLO - Buen Café',
		reviewStatus: 'UNDER_REVIEW',
		securityAnimation: {
			animationType: 'foilShimmer',
		},
	}
}

function getLoyaltyObject({
	classId,
	client,
	objectId,
	passId,
	stamps,
}: {
	classId: string
	client: ClientData
	objectId: string
	passId: string
	stamps: number
}) {
	const stripIndex = Math.min(stamps, 10)
	const discountPercentage = Number.parseInt(
		client.discount_per || client.client_groups_discount || '0',
		10,
	)

	const balanceAmount = Number.parseFloat(client.ewallet ?? '0') / 100

	const textModulesData = [] as { body: string; header: string; id: string }[]

	if (client.client_groups_name) {
		textModulesData.push({
			body: client.client_groups_name,
			header: 'Grupo',
			id: 'grupo',
		})
	}

	if (discountPercentage) {
		textModulesData.push({
			body: `${discountPercentage}%`,
			header: 'Descuento',
			id: 'discount',
		})
	}

	const accountName =
		client.firstname || client.lastname
			? [client.firstname, client.lastname].filter(Boolean).join(' ')
			: client.phone || 'Cliente'

	return {
		accountId: passId,
		accountName,
		barcode: {
			alternateText: passId,
			type: 'QR_CODE',
			value: passId,
		},
		classId,
		heroImage: {
			contentDescription: {
				defaultValue: {
					language: 'en-US',
					value: 'TOLO',
				},
			},
			sourceUri: {
				uri: `https://app.tolo.cafe/pass/strip-${stripIndex}@2x.png`,
			},
		},
		hexBackgroundColor: '#3d6039',
		id: objectId,
		locations: [
			{
				kind: 'walletobjects#latLongPoint',
				latitude: 19.279_918,
				longitude: -99.648_828,
			},
		],
		loyaltyPoints: {
			balance: {
				money: {
					currencyCode: 'MXN',
					micros: balanceAmount * 1_000_000,
				},
			},
			label: 'Saldo',
		},
		secondaryLoyaltyPoints: {
			balance: {
				int: stamps,
			},
			label: `Sellos`,
		},
		state: 'ACTIVE',
		textModulesData,
	}
}

/**
 * Creates a sample pass class based on the template defined below.
 *
 * This class contains multiple editable fields that showcase how to
 * customize your class.
 *
 * @param res A representation of the HTTP result in Express.
 */
async function getOrCreateLoyaltyClass({
	classId,
	context,
}: {
	classId: `${string}.${string}`
	context: Context<{ Bindings: Bindings }>
}) {
	const baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1'

	const googleClient = getGoogleClient({
		email: context.env.GOOGLE_SERVICE_WALLET_EMAIL,
		key: formatPrivateKey(context.env.GOOGLE_SERVICE_WALLET_PRIVATE_KEY),
	})

	try {
		// Check if the class exists already
		await googleClient
			.request({
				method: 'GET',
				url: `${baseUrl}/loyaltyClass/${classId}`,
			})
			.then((response) => response.data)

		const loyaltyClass = getLoyaltyClass(classId)

		await googleClient
			.request({
				data: loyaltyClass,
				method: 'PUT',
				url: `${baseUrl}/loyaltyClass/${classId}`,
			})
			.then((response) => response.data)
	} catch (error) {
		const loyaltyClass = getLoyaltyClass(classId)

		if (
			error instanceof Error &&
			'response' in error &&
			(error.response as Response).status === 404
		) {
			// Class does not exist
			// Create it now
			await googleClient
				.request({
					data: loyaltyClass,
					method: 'POST',
					url: `${baseUrl}/loyaltyClass`,
				})
				.then((response) => response.data)
		} else {
			throw error
		}
	}
}
