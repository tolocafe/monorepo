import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { authenticate } from '../utils/jwt'

import { generateReceiptPDF } from '../utils/generate-receipt'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

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
					quantity: Number.parseInt(item.num),
					price: Number.parseInt(item.product_price),
					total: total,
				}
			})

			const pdfBuffer = await generateReceiptPDF(
				{
					title: 'Recibo de Compra',
					orderId: orderId,
					date: new Date().toISOString(),
					clientName: client
						? `${client.firstname} ${client.lastname}`.trim()
						: undefined,
					products: products ?? [],
					subtotal,
					tip: Number.parseInt(order.tip_sum),
					tax: Number.parseInt(order.tax_sum),
					total: Number.parseInt(order.payed_sum),
					discount:
						Number.parseInt(order.sum) - Number.parseInt(order.payed_sum),
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
