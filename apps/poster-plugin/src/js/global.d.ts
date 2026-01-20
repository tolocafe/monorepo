/* eslint-disable unicorn/require-module-specifiers, perfectionist/sort-modules, @typescript-eslint/consistent-type-definitions */

interface PosterInterface {
	closePopup(): void
	popup(config: { height: number; title: string; width: number }): void
	scanBarcode(): Promise<{ barcode: string }>
	showApplicationIconAt(config: { order?: string; payment?: string }): void
}

interface PosterOrders {
	getOrder(orderId: number): Promise<unknown>
	setOrderClient(orderId: number, clientId: number): Promise<void>
}

interface PosterPayments {
	createPayment(data: unknown): Promise<unknown>
}

interface PosterProducts {
	getProducts(): Promise<unknown>
}

interface PosterSettings {
	getSettings(): Promise<unknown>
}

interface PosterUsers {
	getUser(userId: number): Promise<unknown>
}

interface PosterAPI {
	interface: PosterInterface
	makeRequest: (
		url: string,
		options:
			| {
					data?: unknown
					headers?: string[]
					method?: 'delete' | 'get' | 'post' | 'put'
					timeout?: number
			  }
			| undefined,
		callback: (response: { result: string }) => void,
	) => Promise<unknown>
	on: {
		(
			event: 'applicationIconClicked',
			callback: (data: {
				order: { id: number; userId?: string }
				place: 'order' | 'payment'
			}) => void,
		): void
		(event: 'afterPopupClosed', callback: () => void): void
		(
			event: 'orderClientChange',
			callback: (data: { clientId: string }) => void,
		): void
		(event: string, callback: (data?: unknown) => void): void
	}
	orders: PosterOrders
	payments: PosterPayments
	products: PosterProducts
	settings: PosterSettings
	users: PosterUsers
}

declare global {
	const Poster: PosterAPI
	interface Window {
		Poster: PosterAPI
	}
}

export {}
