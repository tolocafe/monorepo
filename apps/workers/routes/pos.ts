import { Hono } from 'hono'

import { defaultJsonHeaders } from '~workers/utils/headers'
import { api } from '~workers/utils/poster'
import {
	canRedeemBirthdayDrink,
	getCustomerStamps,
} from '~workers/utils/stamps'

import type { PosClientData } from '~common/api'
import type { Bindings } from '~workers/types'

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

		const [products, customer, transactions] = await Promise.all([
			api.menu.getMenuProducts(context.env.POSTER_TOKEN),
			api.clients.getClientById(context.env.POSTER_TOKEN, Number(customerId)),
			api.dash.getTransactions(context.env.POSTER_TOKEN, {
				date_from: last90Days.toISOString().split('T')[0],
				id: customerId,
				include_products: 'true',
				type: 'clients',
			}),
		])

		// Get closed transactions for 2025 to calculate stamps
		const closedTransactions2025 = await api.dash.getTransactions(
			context.env.POSTER_TOKEN,
			{
				date_from: '2025-01-01',
				id: customerId,
				status: '2',
				type: 'clients',
			},
		)

		const stampsData = await getCustomerStamps(
			context.env.D1_TOLO,
			Number(customerId),
			closedTransactions2025.length,
		)

		const canRedeemBirthday = await canRedeemBirthdayDrink(
			context.env.D1_TOLO,
			Number(customerId),
			customer?.birthday,
		)

		const sanitizedCustomer = {
			canRedeemBirthday,
			name: `${customer?.firstname}${customer?.lastname ? ` ${customer.lastname}` : ''}`,
			registrationDate: customer?.date_activale,
			stamps: stampsData.stamps,
			totalPayedSum: formatAmount(customer?.total_payed_sum),
		}

		const menu = products
			.filter((product) => product.hidden !== '1')
			.map((product) => ({
				groupModifications: product.group_modifications?.map((group) => ({
					modifications: group.modifications?.map((modification) => ({
						name: modification.name,
						price: modification.price,
					})),
					name: group.name,
				})),
				modifications: product.modifications?.map((modification) => ({
					name: modification.name,
					price: modification.price,
				})),
				name: product.product_name,
			}))

		const customerTransactions = transactions.map((transaction) => ({
			amount: formatAmount(transaction.sum),
			date: new Date(Number(transaction.date_start)).toISOString(),
			guestCount: Number(transaction.guests_count ?? '1'),
			products: transaction.products?.map((transactionProduct) => {
				const menuProduct = products.find(
					(p) => p.product_id === transactionProduct.product_id,
				)

				return {
					category: menuProduct?.category_name,
					// modifications: [], // add modifications for this product order
					name: menuProduct?.product_name,
					number: Number(transactionProduct.num),
				}
			}),
			serviceMode: getServiceMode(transaction.service_mode),
		}))

		let summary = ''

		try {
			summary = await context.env.AI.run(
				'@cf/meta/llama-3.2-3b-instruct',
				{
					messages: [
						{
							content: `
You generate short, actionable hints for a barista based ONLY on the data provided.

Goal:
- Infer the customer's stable preferences (taste, temperature, sweetness, milk, size, caffeine, time-of-day).
- Suggest drinks that match those preferences and EXIST in the available products list.

Output:
- Language: Spanish.
- Format: Introduction and 3–6 bullet points.
- Introduction: A really brief introduction about the customer's preferences and history.
- First bullets: preference summary (e.g. "Prefiere bebidas calientes y poco dulces").
- Last 1–2 bullets: concrete recommendations, prefixed with "Recomendación:".
- Max 500 characters total.
- Do NOT greet, do NOT explain your reasoning, do NOT repeat raw data.

Constraints:
- Use only products that appear in the "menu" list.
- If history is too short or inconsistent, say so briefly and still give 1 safe recommendation if possible.
`,
							role: 'system',
						},
						{
							content: JSON.stringify({
								customer: sanitizedCustomer,
								customerTransactions,
								menu,
							}),
							role: 'user',
						},
					],
				},
				{
					gateway: { id: 'main' },
					tags: ['pos'],
				},
			).then((result) => result.response ?? '')
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(error)
		}

		return context.json<PosClientData>(
			{
				client: sanitizedCustomer,
				summary,
				transactions: customerTransactions,
			},
			200,
			defaultJsonHeaders,
		)
	},
)

export default pos
