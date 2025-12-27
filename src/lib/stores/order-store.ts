import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { createJSONStorage, persist } from 'zustand/middleware'
import { create } from 'zustand/react'
import { useShallow } from 'zustand/react/shallow'

import { trackEvent } from '@/lib/analytics'
import { selfQueryOptions } from '@/lib/queries/auth'

import { zustandStore } from '.'

export type Modifications = Record<string, number>

export type Location = {
	id: string
	name: string
}

/** Available locations for the app */
export const LOCATIONS: Location[] = [{ id: '1', name: 'Toluca' }]

/** Default location ID */
export const DEFAULT_LOCATION_ID = LOCATIONS[0].id

export type TableContext = {
	locationId: string
	tableId: string
}

export type Order = {
	apiOrderId?: string
	createdAt?: Date
	customerNote?: string
	id: string
	products: OrderProduct[]
	status: 'cancelled' | 'completed' | 'confirmed' | 'draft' | 'submitted'
	/** Table context for dine-in orders */
	tableContext?: TableContext
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
	clearTableContext: () => void
	createOrder: () => void
	currentOrder: null | Order
	getTotalItems: () => number
	locationId: string
	removeItem: (productId: string) => void
	setLocationId: (locationId: string) => void
	setTableContext: (context: TableContext) => void
	updateItem: (
		productId: string,
		modifications: Modifications | undefined,
		quantity: number,
	) => void
}

function getOrderTotalItems(order: null | Order | undefined): number {
	if (!order) return 0
	return order.products.reduce((total, item) => total + item.quantity, 0)
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
			clearTableContext() {
				const { currentOrder } = get()
				if (!currentOrder) return

				const { tableContext: _, ...orderWithoutTable } = currentOrder
				set({ currentOrder: orderWithoutTable as Order })
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
				return getOrderTotalItems(get().currentOrder)
			},
			locationId: DEFAULT_LOCATION_ID,
			removeItem(productId) {
				const { currentOrder } = get()
				if (!currentOrder) return

				const updatedItems = currentOrder.products.filter(
					(item) => item.id !== productId,
				)

				const updatedOrder = { ...currentOrder, products: updatedItems }

				// If no items left, clear the order
				if (updatedItems.length === 0) {
					set({ currentOrder: null })
				} else {
					set({ currentOrder: updatedOrder })
				}
			},
			setLocationId(locationId) {
				set({ locationId })
			},
			setTableContext(context) {
				const { currentOrder } = get()

				if (!currentOrder) {
					get().createOrder()
					return get().setTableContext(context)
				}

				set({
					currentOrder: { ...currentOrder, tableContext: context },
				})
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
			partialize: (state) => ({
				currentOrder: state.currentOrder,
				locationId: state.locationId,
			}),
			storage: createJSONStorage(() => zustandJsonStorage),
		},
	),
)

export const useCurrentOrderItemsCount = () =>
	useOrderStore(useShallow((state) => getOrderTotalItems(state.currentOrder)))
export const useCurrentOrder = () =>
	useOrderStore(useShallow((state) => state.currentOrder))
export const useUpdateItem = () => useOrderStore((state) => state.updateItem)
export const useClearOrder = () => useOrderStore((state) => state.clearOrder)
export const useTableContext = () =>
	useOrderStore(useShallow((state) => state.currentOrder?.tableContext))
export const useSetTableContext = () =>
	useOrderStore((state) => state.setTableContext)
export const useClearTableContext = () =>
	useOrderStore((state) => state.clearTableContext)
export const useIsDineIn = () =>
	useOrderStore(
		useShallow((state) => Boolean(state.currentOrder?.tableContext)),
	)

export const useLocationId = () =>
	useOrderStore(useShallow((state) => state.locationId))

export const useSelectedLocation = () =>
	useOrderStore(
		useShallow((state) =>
			LOCATIONS.find((location) => location.id === state.locationId),
		),
	)

export const useSetLocationId = () =>
	useOrderStore((state) => state.setLocationId)

export const useAddItemGuarded = () => {
	const addItem = useOrderStore((state) => state.addItem)
	const { data: user } = useQuery(selfQueryOptions)

	return (item: Pick<OrderProduct, 'id' | 'modifications' | 'quantity'>) => {
		const isAuthenticated = Boolean(user)

		if (!isAuthenticated) {
			router.push('/sign-in')
			return false
		}

		void trackEvent('cart:item_add', {
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
