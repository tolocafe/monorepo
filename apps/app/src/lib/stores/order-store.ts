import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { createJSONStorage, persist } from 'zustand/middleware'
import { create } from 'zustand/react'
import { useShallow } from 'zustand/react/shallow'

import { trackEvent } from '@/lib/analytics'
import { selfQueryOptions } from '@/lib/queries/auth'

import { zustandStore } from '.'

export type Modifications = Record<string, number>

export type OrderProduct = {
	id: string
	/** Modification Group ID -> Modification ID */
	modifications?: Modifications
	quantity: number
}

const zustandJsonStorage = {
	getItem: (key: string) => zustandStore.getString(key) ?? null,
	removeItem: (key: string) => zustandStore.remove(key),
	setItem: (key: string, value: string) => zustandStore.set(key, value),
}

type OrderStore = {
	addItem: (
		item: Pick<OrderProduct, 'id' | 'modifications' | 'quantity'>,
	) => void
	clearOrder: () => void
	getTotalItems: () => number
	products: OrderProduct[]
	removeItem: (productId: string) => void
	setTransactionId: (transactionId: string) => void
	/** Active dine-in transaction ID from Poster */
	transactionId: null | string
	updateItem: (
		productId: string,
		modifications: Modifications | undefined,
		quantity: number,
	) => void
}

function getProductsTotalItems(products: OrderProduct[]): number {
	return products.reduce((total, item) => total + item.quantity, 0)
}

export const useOrderStore = create<OrderStore>()(
	persist(
		(set, get) => ({
			addItem(item) {
				const { products } = get()

				const existingItemIndex = products.findIndex(
					(existingItem) =>
						existingItem.id === item.id &&
						JSON.stringify(existingItem.modifications) ===
							JSON.stringify(item.modifications),
				)

				let updatedProducts: OrderProduct[]
				if (existingItemIndex === -1) {
					// Add new item
					updatedProducts = [...products, { ...item }]
				} else {
					// Update existing item quantity
					updatedProducts = products.map((existingItem, index) =>
						index === existingItemIndex
							? {
									...existingItem,
									quantity: existingItem.quantity + item.quantity,
								}
							: existingItem,
					)
				}

				set({ products: updatedProducts })
			},
			clearOrder() {
				set({ products: [], transactionId: null })
			},
			getTotalItems() {
				return getProductsTotalItems(get().products)
			},
			products: [],
			removeItem(productId) {
				const { products, transactionId } = get()

				const updatedProducts = products.filter((item) => item.id !== productId)

				// If no items left and no transaction, fully clear
				if (updatedProducts.length === 0 && !transactionId) {
					set({ products: [], transactionId: null })
				} else {
					set({ products: updatedProducts })
				}
			},
			setTransactionId(transactionId) {
				set({ transactionId })
			},
			transactionId: null,
			updateItem(productId, modifications, quantity) {
				const { products } = get()

				if (quantity <= 0) {
					set({
						products: products.filter(
							(item) =>
								item.id !== productId ||
								JSON.stringify(item.modifications) !==
									JSON.stringify(modifications),
						),
					})
					return
				}

				const updatedProducts = products.map((item) =>
					item.id === productId &&
					JSON.stringify(item.modifications) === JSON.stringify(modifications)
						? { ...item, quantity }
						: item,
				)

				set({ products: updatedProducts })
			},
		}),
		{
			name: 'tolo-order-storage',
			partialize: (state) => ({
				products: state.products,
				transactionId: state.transactionId,
			}),
			storage: createJSONStorage(() => zustandJsonStorage),
		},
	),
)

export const useOrderItemsCount = () =>
	useOrderStore(useShallow((state) => getProductsTotalItems(state.products)))
export const useOrderProducts = () =>
	useOrderStore(useShallow((state) => state.products))
export const useTransactionId = () =>
	useOrderStore(useShallow((state) => state.transactionId))
export const useUpdateItem = () => useOrderStore((state) => state.updateItem)
export const useClearOrder = () => useOrderStore((state) => state.clearOrder)
export const useSetTransactionId = () =>
	useOrderStore((state) => state.setTransactionId)

/** Returns true if there's an active order (has products or transaction) */
export const useHasActiveOrder = () =>
	useOrderStore(
		useShallow(
			(state) => state.products.length > 0 || state.transactionId !== null,
		),
	)

export const useAddItemGuarded = () => {
	const addItem = useOrderStore((state) => state.addItem)
	const { data: user } = useQuery(selfQueryOptions)

	return (item: Pick<OrderProduct, 'id' | 'modifications' | 'quantity'>) => {
		const isAuthenticated = Boolean(user)

		if (!isAuthenticated) {
			router.push('/sign-in')
			return false
		}

		trackEvent('cart:item_add', {
			has_modifications: Boolean(
				item.modifications && Object.keys(item.modifications).length > 0,
			),
			product_id: item.id,
			quantity: item.quantity.toString(),
		})

		addItem(item)

		return true
	}
}
