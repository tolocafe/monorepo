import type { Bindings } from 'workers/types'

const BASE_WEBFLOW_URL = 'https://api.webflow.com/v2'

const webflow = {
	collections: {
		async getCoffee(environment: Bindings, itemId: string) {
			const collectionId = environment.WEBFLOW_COFFEES_COLLECTION_ID

			const data = await fetch(
				`${BASE_WEBFLOW_URL}/collections/${collectionId}/items/${itemId}/live`,
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
				`${BASE_WEBFLOW_URL}/collections/${collectionId}/items/${itemId}/live`,
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
				`${BASE_WEBFLOW_URL}/collections/${collectionId}/items/live`,
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
	},
}

export default webflow
