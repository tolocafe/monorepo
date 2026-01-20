import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals'

import { useOrderStore } from '~/lib/stores/order-store'

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
jest.mock('~/lib/queries/auth', () => ({
	selfQueryOptions: { queryFn: jest.fn(), queryKey: ['self'] },
}))

const createMockProducts = () => [
	{ id: 'espresso', modifications: undefined, quantity: 1 },
	{ id: 'latte', modifications: undefined, quantity: 2 },
]

describe('useOrderStore removeItem', () => {
	beforeEach(() => {
		useOrderStore.setState({
			products: createMockProducts(),
			transactionId: null,
		})
	})

	afterEach(() => {
		useOrderStore.setState({ products: [], transactionId: null })
	})

	it('removes only the matching product while preserving others', () => {
		useOrderStore.getState().removeItem('espresso')

		const { products } = useOrderStore.getState()

		expect(products).toHaveLength(1)
		expect(products.at(0)?.id).toBe('latte')
	})

	it('clears the order when the final product is removed and no transaction', () => {
		useOrderStore.setState({
			products: [{ id: 'espresso', modifications: undefined, quantity: 1 }],
			transactionId: null,
		})

		useOrderStore.getState().removeItem('espresso')

		const { products, transactionId } = useOrderStore.getState()
		expect(products).toHaveLength(0)
		expect(transactionId).toBeNull()
	})

	it('keeps transaction when final product is removed but transaction exists', () => {
		useOrderStore.setState({
			products: [{ id: 'espresso', modifications: undefined, quantity: 1 }],
			transactionId: '123',
		})

		useOrderStore.getState().removeItem('espresso')

		const { products, transactionId } = useOrderStore.getState()
		expect(products).toHaveLength(0)
		expect(transactionId).toBe('123')
	})
})
