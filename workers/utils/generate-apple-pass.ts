import { captureException } from '@sentry/cloudflare'
import { PKPass } from 'passkit-generator'

import type { ClientData } from '@common/api'
import type { Context } from 'hono'
import type { Bindings } from 'workers/types'

import { getCustomerPoints } from './points'
import { api } from './poster'

const PASS_TYPE_IDENTIFIER = 'pass.cafe.tolo.app'
const STORE_IDENTIFIER = 6_749_597_635
const TEAM_IDENTIFIER = 'AUR7UR6M72'

export const currencyFormatter = new Intl.NumberFormat('es-MX', {
	currency: 'MXN',
	minimumFractionDigits: 0,
	style: 'currency',
})

const imagesToAdd = (visitCount: number) => {
	const stripIndex = visitCount % 11

	return [
		{ name: 'icon.png', path: '/pass/icon.png' },
		{ name: 'icon@2x.png', path: '/pass/icon@2x.png' },
		{ name: 'icon@3x.png', path: '/pass/icon@3x.png' },
		{ name: 'logo.png', path: '/pass/logo.png' },
		{ name: 'logo@2x.png', path: '/pass/logo@2x.png' },
		{ name: 'logo@3x.png', path: '/pass/logo@3x.png' },
		{ name: 'strip.png', path: `/pass/strip-${stripIndex}.png` },
		{ name: 'strip@2x.png', path: `/pass/strip-${stripIndex}@2x.png` },
	]
}

export default async function createApplePass(
	context: Context<{ Bindings: Bindings }>,
	passAuthToken: string, // This should be the pass-specific auth token, not JWT
	client: ClientData,
) {
	const certificates = {
		signerCert: context.env.SIGNER_CERT,
		signerKey: context.env.SIGNER_KEY,
		signerKeyPassphrase: context.env.SIGNER_PASSPHRASE,
		wwdr: context.env.WWDR,
	}

	const serialNumber = `TOLO-${client.client_id.padStart(8, '0')}`

	const pass = new PKPass({}, certificates, {
		appLaunchURL: 'https://app.tolo.cafe/more/top-up',
		associatedStoreIdentifiers: [STORE_IDENTIFIER],
		authenticationToken: passAuthToken, // Use pass-specific token
		backgroundColor: '#3D6039',
		description: 'TOLO Pass',
		foregroundColor: '#FFFFFF',
		formatVersion: 1,
		labelColor: '#DDDDDD',
		organizationName: 'TOLO',
		passTypeIdentifier: PASS_TYPE_IDENTIFIER,
		serialNumber,
		sharingProhibited: true,
		teamIdentifier: TEAM_IDENTIFIER,
		webServiceURL: 'https://app.tolo.cafe/api/webhooks/passes',
	})

	pass.type = 'storeCard'

	// Count only closed transactions (status: '2') from all time
	const transactionsCount = await api.dash
		.getTransactions(context.env.POSTER_TOKEN, {
			date_from: '2025-01-01',
			id: client.client_id,
			status: '2',
			type: 'clients',
		})
		.then((transactions) => transactions.length)

	// Calculate points based on transactions and redemptions
	const pointsData = await getCustomerPoints(
		context.env.D1_TOLO,
		Number.parseInt(client.client_id, 10),
		transactionsCount,
	)

	pass.headerFields.push(
		{
			key: 'ewallet',
			label: 'Saldo',
			value: currencyFormatter.format(
				Number.parseFloat(client.ewallet ?? '0') / 100,
			),
		},
		{
			key: 'points',
			label: `Puntos`,
			value: pointsData.points,
		},
	)

	pass.secondaryFields.push(
		{
			key: 'client-name',
			label: 'Nombre',
			value:
				client.firstname || client.lastname
					? [client.firstname, client.lastname].filter(Boolean).join(' ')
					: '-',
		},
		{
			key: 'client-group',
			label: 'Grupo',
			value: client.client_groups_name || '-',
		},
	)

	const discountPercentage = Number.parseInt(
		client.discount_per || client.client_groups_discount || '0',
	)
	if (discountPercentage) {
		pass.auxiliaryFields.push({
			key: 'discount',
			label: 'Descuento',
			value: `${discountPercentage}%`,
		})
	}

	const barcodeMessage = serialNumber

	pass.setBarcodes({
		altText: barcodeMessage,
		format: 'PKBarcodeFormatQR',
		message: barcodeMessage,
	})

	for (const { name, path } of imagesToAdd(pointsData.points)) {
		try {
			const imageBuffer = await getAssetImage(context.env.ASSETS, path)
			pass.addBuffer(name, imageBuffer)
		} catch (error) {
			captureException(error)
		}
	}

	pass.setLocations({
		latitude: 19.279_918,
		longitude: -99.648_828,
		relevantText: 'Pino Suárez, Toluca',
	})

	pass.setBeacons({
		major: 1,
		minor: 1,
		proximityUUID: 'FDA50693A4E24FB1AFCFC6EB07647825',
		relevantText: 'Carrito de Café',
	})

	return pass
}

async function getAssetImage(assets: Fetcher, path: string) {
	// The assets binding only uses the pathname, domain is ignored
	const response = await assets.fetch(new Request(`https://assets${path}`))

	if (!response.ok) {
		throw new Error(
			`Failed to fetch asset: ${path} - Status: ${response.status}`,
		)
	}

	const image = await response.arrayBuffer()

	return Buffer.from(image)
}
