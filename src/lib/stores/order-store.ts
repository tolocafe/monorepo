import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { MMKV } from 'react-native-mmkv'
import { createJSONStorage, persist } from 'zustand/middleware'
import { create } from 'zustand/react'
import { useShallow } from 'zustand/react/shallow'

import { STORAGE_KEYS } from '@/lib/constants/storage'
import { trackEvent } from '@/lib/analytics/firebase'
import { selfQueryOptions } from '@/lib/queries/auth'
import { productQueryOptions } from '@/lib/queries/product'

export type Order = {
	apiOrderId?: string
	createdAt: Date
	customerNote?: string
	id: string
	products: OrderProduct[]
	status: 'cancelled' | 'completed' | 'confirmed' | 'draft' | 'submitted'
	totalAmount: number
	updatedAt: Date
}

export type OrderProduct = {
	id: string
	modifications?: {
		id: string
		name: string
		price: number
	}[]
	quantity: number
}

const zustandStore = new MMKV({
	id: STORAGE_KEYS.ZUSTAND_STORE,
})

const zustandJsonStorage = {
	getItem: (key: string) => zustandStore.getString(key) ?? null,
	removeItem: (key: string) => zustandStore.delete(key),
	setItem: (key: string, value: string) => zustandStore.set(key, value),
}

type OrderStore = {
	addItem: (item: Pick<OrderProduct, 'id' | 'quantity'>) => void
	clearOrder: () => void

	// Actions
	createOrder: () => void
	currentOrder: null | Order
	getTotalAmount: () => number
	// Getters
	getTotalItems: () => number
	removeItem: (productId: string) => void
	updateItem: (productId: string, quantity: number) => void
}

export const useOrderStore = create<OrderStore>()(
	persist(
		(set, get) => ({
			addItem: (item: Pick<OrderProduct, 'id' | 'quantity'>) => {
				const { currentOrder } = get()
				if (!currentOrder) {
					get().createOrder()
					return get().addItem(item)
				}

				const existingItemIndex = currentOrder.products.findIndex(
					(existingItem) => existingItem.id === item.id,
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
					currentOrder: {
						...currentOrder,
						products: updatedItems,
						totalAmount: 0, // Will be calculated when needed
						updatedAt: new Date(),
					},
				})
			},
			clearOrder: () => {
				set({ currentOrder: null })
			},
			createOrder: () => {
				const nextOrder: Order = {
					createdAt: new Date(),
					id: `order-${Date.now()}`,
					products: [],
					status: 'draft',
					totalAmount: 0,
					updatedAt: new Date(),
				}
				set({ currentOrder: nextOrder })
			},

			currentOrder: null,

			getTotalAmount: () => {
				const { currentOrder } = get()
				return currentOrder?.totalAmount || 0
			},

			// Getters
			getTotalItems: () => {
				const { currentOrder } = get()
				if (!currentOrder) return 0
				return currentOrder.products.reduce(
					(total, item) => total + item.quantity,
					0,
				)
			},

			hasItems: () => {
				const { currentOrder } = get()
				return Boolean(currentOrder && currentOrder.products.length > 0)
			},

			removeItem: (productId: string) => {
				const { currentOrder } = get()
				if (!currentOrder) return

				const updatedItems = currentOrder.products.filter(
					(item) => item.id !== productId,
				)

				const updatedOrder = {
					...currentOrder,
					items: updatedItems,
					totalAmount: 0, // Will be calculated when needed
					updatedAt: new Date(),
				}

				// If no items left, clear the order
				if (updatedItems.length === 0) {
					set({ currentOrder: null })
				} else {
					set({ currentOrder: updatedOrder })
				}
			},
			updateItem: (productId: string, quantity: number) => {
				const { currentOrder } = get()
				if (!currentOrder) return

				if (quantity <= 0) {
					set({
						currentOrder: {
							...currentOrder,
							products: currentOrder.products.filter(
								(item) => item.id !== productId,
							),
						},
					})
					return
				}

				const updatedItems = currentOrder.products.map((item) =>
					item.id === productId ? { ...item, quantity } : item,
				)

				set({
					currentOrder: {
						...currentOrder,
						products: updatedItems,
						totalAmount: 0, // Will be calculated when needed
						updatedAt: new Date(),
					},
				})
			},
		}),
		{
			name: 'tolo-order-storage',
			partialize: (state) => ({
				currentOrder: state.currentOrder,
			}),
			storage: createJSONStorage(() => zustandJsonStorage),
		},
	),
)

// For computed values that might have same content but different references
export const useOrderStats = () =>
	useOrderStore(
		useShallow((state) => ({
			totalAmount: state.getTotalAmount(),
			totalItems: state.getTotalItems(),
		})),
	)

export const useCurrentOrder = () =>
	useOrderStore((state) => state.currentOrder)
export const useUpdateItem = () => useOrderStore((state) => state.updateItem)
export const useClearOrder = () => useOrderStore((state) => state.clearOrder)

export const useAddItemGuarded = () => {
	const addItem = useOrderStore((state) => state.addItem)
	const { data: user } = useQuery(selfQueryOptions)
	const queryClient = useQueryClient()

	return (item: Pick<OrderProduct, 'id' | 'quantity'>) => {
		const isAuthenticated = Boolean(user)
		if (!isAuthenticated) {
			const product = queryClient.getQueryData(
				productQueryOptions(item.id).queryKey,
			)
			const itemName = product?.product_name

			router.push(
				itemName
					? { params: { itemName }, pathname: '/sign-in' }
					: { pathname: '/sign-in' },
			)
			return
		}

		void trackEvent('add_to_cart', {
			item_id: item.id,
			quantity: item.quantity.toString(),
		})

		addItem(item)
	}
}
