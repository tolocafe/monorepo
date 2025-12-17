/* eslint-disable no-console */
/* eslint-disable unicorn/no-keyword-prefix */
import { JWT } from 'google-auth-library'
import jwt from 'jsonwebtoken'

import type { ClientData, DashTransaction } from '@common/api'
import type { Context } from 'hono'
import type { Bindings } from 'workers/types'

import { api } from './poster'

export default async function createGooglePass(
	context: Context<{ Bindings: Bindings }>,
	_passAuthToken: string,
	client: ClientData,
) {
	try {
		const issuerId = '3388000000022990889'
		const PASS_CLASS_ID = `${issuerId}.10.pass.cafe.tolo.app` as const

		await getOrCreateLoyaltyClass({
			classId: PASS_CLASS_ID,
			context,
		})

		const loyaltyObject = await createLoyaltyObject({
			classId: PASS_CLASS_ID,
			client,
			context,
			issuerId,
		})

		return loyaltyObject
	} catch (error) {
		console.log(error)
		throw error
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
	// Default date_from is 'one month ago', so we need to specify a date far in the past
	const visitsCount = await api.dash
		.getTransactions(context.env.POSTER_TOKEN, {
			date_from: '2025-01-01',
			id: client.client_id,
			status: '2',
			type: 'clients',
		})
		.catch(() => [] as DashTransaction[])

	const loyaltyObject = getLoyaltyObject({
		classId,
		client,
		objectId: `${issuerId}.0.${passId}`,
		passId,
		visitsCount: visitsCount.length,
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
	visitsCount,
}: {
	classId: string
	client: ClientData
	objectId: string
	passId: string
	visitsCount: number
}) {
	const stripIndex = visitsCount % 11
	const discountPercentage = Number.parseInt(
		client.discount_per || client.client_groups_discount || '0',
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
				int: visitsCount,
			},
			label: 'Visitas',
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

	console.log('Getting Google client')

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
			// Something else went wrong
			console.log(error)
			throw error
		}
	}
}
