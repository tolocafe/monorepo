import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { generateReceiptPDF } from '~/workers/utils/generate-receipt'
import { authenticate } from '~/workers/utils/jwt'
import { api } from '~/workers/utils/poster'

import type { Bindings } from '~/workers/types'

const receipts = new Hono<{ Bindings: Bindings }>().get(
	'/:orderId',
	async (context) => {
		const [clientId] = await authenticate(context, context.env.JWT_SECRET)
		const orderId = context.req.param('orderId')

		try {
			// Fetch order data from Poster API
			const order = await api.dash.getTransaction(
				context.env.POSTER_TOKEN,
				orderId,
				{ include_products: 'true' },
			)

			// Check if order exists
			if (!order) {
				return context.json({ error: `Order '${orderId}' not found` }, 404)
			}

			// Verify the order belongs to the authenticated client
			if (order.client_id !== clientId.toString()) {
				throw new HTTPException(403, { message: 'Access denied' })
			}

			// Fetch client data
			const client = await api.clients.getClientById(
				context.env.POSTER_TOKEN,
				order.client_id as unknown as number,
			)

			const productsDetails = await Promise.all(
				order.products?.map((item) =>
					api.menu.getProduct(context.env.POSTER_TOKEN, item.product_id),
				) ?? [],
			)

			// Calculate totals
			let subtotal = 0
			const products = order.products?.map((item) => {
				const total =
					Number.parseInt(item.product_price) * Number.parseInt(item.num)

				subtotal += total

				const productName =
					productsDetails.find(
						(product) => product.product_id === item.product_id,
					)?.product_name ?? ''

				return {
					name: productName,
					price: Number.parseInt(item.product_price),
					quantity: Number.parseInt(item.num),
					total,
				}
			})

			const pdfBuffer = await generateReceiptPDF(
				{
					clientName: client
						? `${client.firstname} ${client.lastname}`.trim()
						: undefined,
					date: new Date().toISOString(),
					discount:
						Number.parseInt(order.sum) - Number.parseInt(order.payed_sum),
					orderId,
					products: products ?? [],
					subtotal,
					tax: Number.parseInt(order.tax_sum),
					tip: Number.parseInt(order.tip_sum),
					title: 'Recibo de Compra',
					total: Number.parseInt(order.payed_sum),
				},
				context.env.BROWSER,
			)

			return new Response(pdfBuffer as unknown as BodyInit, {
				headers: {
					'Content-Disposition': `inline; filename="recibo-${orderId}.pdf"`,
					'Content-Type': 'application/pdf',
				},
			})
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error generating PDF:', error)

			// Handle HTTP exceptions (like 403 Access denied)
			if (error instanceof HTTPException) {
				throw error
			}

			// Check if it's a specific API error
			if (
				error instanceof Error &&
				error.message.includes('Failed to get incoming order')
			) {
				return context.json({ error: 'Order not found' }, 404)
			}

			return context.json({ error: 'Failed to generate PDF' }, 500)
		}
	},
)

export default receipts
