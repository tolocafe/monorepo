import { Hono } from 'hono'

import { defaultJsonHeaders } from '../utils/headers'
import { api } from '../utils/poster'

import type { Bindings } from '../types'

function formatAmount(amount: number | string | undefined) {
	if (!amount) return '$0 MXN'
	return `$${(Number(amount) / 100).toFixed(2)} MXN`
}

function getServiceMode(serviceMode: string | undefined) {
	if (!serviceMode) return 'Unknown'

	switch (serviceMode) {
		case '1':
			return 'At the table'
		case '2':
			return 'Takeaway'
		case '3':
			return 'Delivery'
	}
}

const pos = new Hono<{ Bindings: Bindings }>().get(
	'/clients/:clientId',
	async (context) => {
		const customerId = context.req.param('clientId')
		const posterAccountNumber = context.req.header('x-poster-account-number')

		if (posterAccountNumber !== context.env.POSTER_ACCOUNT_NUMBER) {
			return context.json({ error: 'Invalid poster account number' }, 400)
		}

		if (!customerId) {
			return context.json({ error: 'Client ID is required' }, 400)
		}

		const last90Days = new Date(new Date().setDate(new Date().getDate() - 90))

		const [products, client, transactions] = await Promise.all([
			api.menu.getMenuProducts(context.env.POSTER_TOKEN),
			api.clients.getClientById(
				context.env.POSTER_TOKEN,
				Number.parseInt(customerId),
			),
			api.dash.getTransactions(context.env.POSTER_TOKEN, {
				date_from: last90Days.toISOString().split('T')[0],
				id: customerId,
				include_products: 'true',
				type: 'clients',
			}),
		])

		const sanitizedClient = {
			date_activale: client?.date_activale,
			firstname: client?.firstname,
			lastname: client?.lastname,
			total_payed_sum: formatAmount(client?.total_payed_sum),
		}

		const availableProducts = products.map((product) => product.product_name)

		const populatedTransactions = transactions.map((transaction) => ({
			date: transaction.date_start,
			guest_count: transaction.guests_count,
			products: transaction.products?.map((product) => {
				const productDetails = products.find(
					(p) => p.product_id === product.product_id,
				)

				return {
					category: productDetails?.category_name,
					modifications: productDetails?.modifications?.map((modification) => ({
						name: modification.name,
						price: modification.price,
					})),
					name: productDetails?.product_name,
				}
			}),
			service_mode: getServiceMode(transaction.service_mode),
			sum: formatAmount(transaction.sum),
		}))

		let summary = ''

		try {
			summary = await context.env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
				messages: [
					{
						content: `
You generate short, actionable hints for a barista based ONLY on the data provided.

Goal:
- Infer the customer's stable preferences (taste, temperature, sweetness, milk, size, caffeine, time-of-day).
- Suggest drinks that match those preferences and EXIST in the available products list.

Output:
- Language: Spanish.
- Format: 3–6 bullet points.
- First bullets: preference summary (e.g. "Prefiere bebidas calientes y poco dulces").
- Last 1–2 bullets: concrete recommendations, prefixed with "Recomendación:".
- Max 500 characters total.
- Do NOT greet, do NOT explain your reasoning, do NOT repeat raw data.

Constraints:
- Use only products that appear in the "available_products" list.
- If history is too short or inconsistent, say so briefly and still give 1 safe recommendation if possible.
`,
						role: 'system',
					},
					{
						content: JSON.stringify({
							availableProducts,
							customer: sanitizedClient,
							transactions: populatedTransactions,
						}),
						role: 'user',
					},
				],
			}).then((result) => result.response ?? '')
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(error)
		}

		return context.json(
			{
				client: sanitizedClient,
				summary,
				transactions: populatedTransactions,
			},
			200,
			defaultJsonHeaders,
		)
	},
)

export default pos
