import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals'

import { useOrderStore } from '@/lib/stores/order-store'

jest.mock('expo-router', () => ({
	router: {
		push: jest.fn(),
	},
}))
jest.mock('react-native-mmkv', () => {
	const instance = {
		clearAll: jest.fn(),
		delete: jest.fn(),
		getString: jest.fn(),
		remove: jest.fn(),
		set: jest.fn(),
	}

	return {
		MMKV: jest.fn(() => instance),
		createMMKV: jest.fn(() => instance),
	}
})
jest.mock('@/lib/queries/auth', () => ({
	selfQueryOptions: { queryFn: jest.fn(), queryKey: ['self'] },
}))

const createMockOrder = () => ({
	createdAt: new Date('2025-01-01T00:00:00.000Z'),
	id: 'order-mock',
	locationId: '1',
	products: [
		{ id: 'espresso', modifications: undefined, quantity: 1 },
		{ id: 'latte', modifications: undefined, quantity: 2 },
	],
	status: 'draft' as const,
	tableId: null,
})

describe('useOrderStore removeItem', () => {
	beforeEach(() => {
		useOrderStore.setState({ currentOrder: createMockOrder() })
	})

	afterEach(() => {
		useOrderStore.setState({ currentOrder: null })
	})

	it('removes only the matching product while preserving others', () => {
		useOrderStore.getState().removeItem('espresso')

		const { currentOrder } = useOrderStore.getState()

		expect(currentOrder).not.toBeNull()
		expect(currentOrder?.products).toHaveLength(1)
		expect(currentOrder?.products.at(0)?.id).toBe('latte')
	})

	it('clears the order when the final product is removed', () => {
		useOrderStore.setState({
			currentOrder: {
				...createMockOrder(),

				products: [{ id: 'espresso', modifications: undefined, quantity: 1 }],
			},
		})

		useOrderStore.getState().removeItem('espresso')

		expect(useOrderStore.getState().currentOrder).toBeNull()
	})
})
