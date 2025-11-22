import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { createJSONStorage, persist } from 'zustand/middleware'
import { create } from 'zustand/react'
import { useShallow } from 'zustand/react/shallow'

import { trackEvent } from '@/lib/analytics/firebase'
import { selfQueryOptions } from '@/lib/queries/auth'

import { zustandStore } from '.'

export type Modifications = Record<string, number>

export type Order = {
	apiOrderId?: string
	createdAt?: Date
	customerNote?: string
	id: string
	products: OrderProduct[]
	status: 'cancelled' | 'completed' | 'confirmed' | 'draft' | 'submitted'
}

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
	createOrder: () => void
	currentOrder: null | Order
	getTotalItems: () => number
	removeItem: (productId: string) => void
	updateItem: (
		productId: string,
		modifications: Modifications | undefined,
		quantity: number,
	) => void
}

export const useOrderStore = create<OrderStore>()(
	persist(
		(set, get) => ({
			addItem(item) {
				const { currentOrder } = get()

				if (!currentOrder) {
					get().createOrder()
					return get().addItem(item)
				}

				const existingItemIndex = currentOrder.products.findIndex(
					(existingItem) =>
						existingItem.id === item.id &&
						JSON.stringify(existingItem.modifications) ===
							JSON.stringify(item.modifications),
				)

				let updatedItems: OrderProduct[]
				if (existingItemIndex === -1) {
					// Add new item
					updatedItems = [...currentOrder.products, { ...item }]
				} else {
					// Update existing item quantity
					updatedItems = currentOrder.products.map((existingItem, index) =>
						index === existingItemIndex
							? {
									...existingItem,
									quantity: existingItem.quantity + item.quantity,
								}
							: existingItem,
					)
				}

				set({
					currentOrder: { ...currentOrder, products: updatedItems },
				})
			},
			clearOrder() {
				set({ currentOrder: null })
			},
			createOrder() {
				const nextOrder: Order = {
					createdAt: new Date(),
					id: `order-${Date.now()}`,
					products: [],
					status: 'draft',
				}
				set({ currentOrder: nextOrder })
			},
			currentOrder: null,
			getTotalItems() {
				const { currentOrder } = get()
				if (!currentOrder) return 0
				return currentOrder.products.reduce(
					(total, item) => total + item.quantity,
					0,
				)
			},
			removeItem(productId) {
				const { currentOrder } = get()
				if (!currentOrder) return

				const updatedItems = currentOrder.products.filter(
					(item) => item.id !== productId,
				)

				const updatedOrder = { ...currentOrder, items: updatedItems }

				// If no items left, clear the order
				if (updatedItems.length === 0) {
					set({ currentOrder: null })
				} else {
					set({ currentOrder: updatedOrder })
				}
			},
			updateItem(productId, modifications, quantity) {
				const { currentOrder } = get()
				if (!currentOrder) return

				if (quantity <= 0) {
					set({
						currentOrder: {
							...currentOrder,
							products: currentOrder.products.filter(
								(item) =>
									item.id !== productId ||
									JSON.stringify(item.modifications) !==
										JSON.stringify(modifications),
							),
						},
					})
					return
				}

				const updatedItems = currentOrder.products.map((item) =>
					item.id === productId &&
					JSON.stringify(item.modifications) === JSON.stringify(modifications)
						? { ...item, quantity }
						: item,
				)

				set({ currentOrder: { ...currentOrder, products: updatedItems } })
			},
		}),
		{
			name: 'tolo-order-storage',
			partialize: (state) => ({ currentOrder: state.currentOrder }),
			storage: createJSONStorage(() => zustandJsonStorage),
		},
	),
)

export const useCurrentOrderItemsCount = () =>
	useOrderStore(useShallow((state) => state.getTotalItems()))
export const useCurrentOrder = () =>
	useOrderStore(useShallow((state) => state.currentOrder))
export const useUpdateItem = () => useOrderStore((state) => state.updateItem)
export const useClearOrder = () => useOrderStore((state) => state.clearOrder)

export const useAddItemGuarded = () => {
	const addItem = useOrderStore((state) => state.addItem)
	const { data: user } = useQuery(selfQueryOptions)

	return (item: Pick<OrderProduct, 'id' | 'modifications' | 'quantity'>) => {
		const isAuthenticated = Boolean(user)

		if (!isAuthenticated) {
			router.push('/sign-in')
			return false
		}

		void trackEvent('add_to_cart', {
			item_id: item.id,
			quantity: item.quantity.toString(),
		})

		addItem(item)

		return true
	}
}
