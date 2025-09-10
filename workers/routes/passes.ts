import { randomUUID } from 'node:crypto'

import { captureException } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { PKPass } from 'passkit-generator'

import { authenticate } from '../utils/jwt'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
	currency: 'MXN',
	minimumFractionDigits: 0,
	style: 'currency',
})

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

const PASS_TYPE_IDENTIFIER = 'pass.cafe.tolo.app'

const pass = new Hono<{ Bindings: Bindings }>().get(
	'/:clientId',
	async (context) => {
		try {
			const clientId = Number.parseInt(context.req.param('clientId'), 10)
			const [authenticatedClientId, payload, token] = await authenticate(
				context,
				context.env.JWT_SECRET,
			)

			if (authenticatedClientId !== clientId) {
				return context.json(
					{
						authenticatedClientId,
						clientId,
						message: 'Forbidden, diff',
						payload,
						token,
					},
					403,
				)
			}

			const client = await api.clients.getClientById(
				context.env.POSTER_TOKEN,
				clientId,
			)

			if (!client) {
				return context.json({ message: 'Forbidden' }, 403)
			}

			const PASS_SERIAL_NUMBER = randomUUID().slice(-12)

			const certificates = {
				signerCert: context.env.SIGNER_CERT,
				signerKey: context.env.SIGNER_KEY,
				signerKeyPassphrase: context.env.SIGNER_PASSPHRASE,
				wwdr: context.env.WWDR,
			}

			const pass = new PKPass({}, certificates, {
				appLaunchURL: 'tolo://more/top-up',
				associatedStoreIdentifiers: [6_749_597_635],
				authenticationToken: token || 'test',
				backgroundColor: '#3D6039',
				description: 'TOLO pass',
				foregroundColor: '#FFFFFF',
				formatVersion: 1,
				labelColor: '#DDDDDD',
				organizationName: 'TOLO',
				passTypeIdentifier: PASS_TYPE_IDENTIFIER,
				serialNumber: PASS_SERIAL_NUMBER,
				sharingProhibited: true,
				teamIdentifier: 'AUR7UR6M72',
				webServiceURL: 'https://app.tolo.cafe/api/passes/',
			})

			pass.type = 'storeCard'

			const totalPayedSum = Number.parseInt(client.total_payed_sum ?? '0')

			pass.headerFields.push(
				{
					key: 'ewallet',
					label: 'Saldo',
					value: currencyFormatter.format(
						Number.parseFloat(client.ewallet ?? '0') / 100,
					),
				},
				{
					key: 'visits',
					label: 'Puntos',
					value: totalPayedSum ? Math.floor(totalPayedSum / 20) : '0',
				},
			)

			// pass.setNFC({
			// 	encryptionPublicKey:
			// 		'MDkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDIgADwKMBv29ByaSLiGF0FctuyB+Hs2oZ1kDIYhTVllPexNE=',
			// 	message: client.client_id || clientId,
			// })

			pass.secondaryFields.push(
				{
					key: 'client-name',
					label: 'Nombre',
					value: client.firstname
						? `${client.firstname} ${client.lastname}`
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

			const barcodeMessage = PASS_SERIAL_NUMBER
			//  await signJwt(
			// 	{ sub: clientId.toString() },
			// 	context.env.JWT_PASS_SECRET,
			// 	{ skipIssuedAt: true },
			// )

			pass.setBarcodes({
				altText: barcodeMessage,
				format: 'PKBarcodeFormatQR',
				message: barcodeMessage,
			})

			const imagesToAdd = [
				{ name: 'icon.png', path: '/pass/icon.png' },
				{ name: 'icon@2x.png', path: '/pass/icon@2x.png' },
				{ name: 'icon@3x.png', path: '/pass/icon@2x.png' },
				{ name: 'logo.png', path: '/pass/logo.png' },
				{ name: 'logo@2x.png', path: '/pass/logo@2x.png' },
				{ name: 'logo@3x.png', path: '/pass/logo@3x.png' },
				{ name: 'strip.png', path: '/pass/strip.png' },
				{ name: 'strip@2x.png', path: '/pass/strip@2x.png' },
				{ name: 'strip@3x.png', path: '/pass/strip@3x.png' },
			]

			for (const { name, path } of imagesToAdd) {
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
				relevantText: 'Toluca',
			})

			return new Response(pass.getAsBuffer(), {
				headers: {
					'Content-disposition': `attachment; filename=tolo-pass.pkpass`,
					'Content-type': pass.mimeType,
				},
			})
		} catch (error) {
			captureException(error)

			return context.json({ message: 'Error generating pass' }, 500)
		}
	},
)

export default pass
