import type { Bindings } from '~workers/types'

const WEBFLOW_BASE_URL = 'https://api.webflow.com/v2'

const webflow = {
	collections: {
		async getCoffee(environment: Bindings, itemId: string) {
			const collectionId = environment.WEBFLOW_COFFEES_COLLECTION_ID

			const data = await fetch(
				`${WEBFLOW_BASE_URL}/collections/${collectionId}/items/${itemId}/live`,
				{
					headers: { Authorization: `Bearer ${environment.WEBFLOW_API_TOKEN}` },
				},
			).then(
				(response) =>
					response.json() as Promise<{ fieldData: Record<string, string> }>,
			)

			return data.fieldData
		},
		async getEvent(environment: Bindings, itemId: string) {
			const collectionId = environment.WEBFLOW_EVENTS_COLLECTION_ID

			const data = await fetch(
				`${WEBFLOW_BASE_URL}/collections/${collectionId}/items/${itemId}/live`,
				{
					headers: { Authorization: `Bearer ${environment.WEBFLOW_API_TOKEN}` },
				},
			).then(
				(response) =>
					response.json() as Promise<{ fieldData: Record<string, string> }>,
			)

			return data.fieldData
		},
		async getProduct(environment: Bindings, itemId: string) {
			const collectionId = environment.WEBFLOW_MENU_COLLECTION_ID

			const data = await fetch(
				`${WEBFLOW_BASE_URL}/collections/${collectionId}/items/${itemId}/live`,
				{
					headers: { Authorization: `Bearer ${environment.WEBFLOW_API_TOKEN}` },
				},
			).then(
				(response) =>
					response.json() as Promise<{ fieldData: Record<string, string> }>,
			)

			return data.fieldData
		},

		async listCoffees(environment: Bindings) {
			const collectionId = environment.WEBFLOW_COFFEES_COLLECTION_ID

			const data = await fetch(
				`${WEBFLOW_BASE_URL}/collections/${collectionId}/items/live`,
				{
					headers: { Authorization: `Bearer ${environment.WEBFLOW_API_TOKEN}` },
				},
			).then(
				(response) =>
					response.json() as Promise<{
						items: null | { fieldData: Record<string, string> }[]
					}>,
			)

			return data.items?.map((item) => item.fieldData)
		},

		async listEvents(environment: Bindings) {
			const collectionId = environment.WEBFLOW_EVENTS_COLLECTION_ID

			const data = await fetch(
				`${WEBFLOW_BASE_URL}/collections/${collectionId}/items/live`,
				{
					headers: { Authorization: `Bearer ${environment.WEBFLOW_API_TOKEN}` },
				},
			).then(
				(response) =>
					response.json() as Promise<{
						items: null | { fieldData: Record<string, string> }[]
					}>,
			)

			return data.items?.map((item) => item.fieldData)
		},

		async listPromotions(environment: Bindings) {
			const collectionId = environment.WEBFLOW_PROMOTIONS_COLLECTION_ID

			const data = await fetch(
				`${WEBFLOW_BASE_URL}/collections/${collectionId}/items/live`,
				{
					headers: { Authorization: `Bearer ${environment.WEBFLOW_API_TOKEN}` },
				},
			).then(
				(response) =>
					response.json() as Promise<{
						items:
							| null
							| {
									fieldData: Record<
										'name' | 'poster-id' | 'slug' | 'summary',
										unknown
									>
							  }[]
					}>,
			)

			return data.items?.map((item) => item.fieldData)
		},
	},
}

export default webflow
