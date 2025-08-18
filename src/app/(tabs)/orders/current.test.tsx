import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'
import { Alert } from 'react-native'

import OrderDetail from '@/app/(tabs)/orders/current'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import { useAddItem, useClearOrder } from '@/lib/stores/order-store'

// Mocks
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
}))

jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons')

jest.mock('@/lib/services/api-service', () => {
  const ordersCreate = jest.fn()
  const authSelf = jest.fn()
  const menuGetProduct = jest.fn()
  return {
    api: {
      auth: { self: authSelf },
      menu: { getProduct: menuGetProduct },
      orders: { create: ordersCreate },
      __mocks: { ordersCreate, authSelf, menuGetProduct },
    },
  }
})

// Helper to seed store with a fresh state
function resetState() {
  const { result } = renderHookWithClient(() => useClearOrder())
  act(() => {
    result.current()
  })
}

function renderWithClient(ui: React.ReactElement) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function renderHookWithClient<T>(hook: () => T) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(hook, { wrapper })
}

describe('OrderDetail - insufficient balance alert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    queryClient.clear()
    resetState()
  })

  it('shows an alert and prevents submission when wallet balance is insufficient', async () => {
    const { api } = jest.requireMock('@/lib/services/api-service') as unknown as {
      api: any
    }

    // Spy on Alert
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})

    // Seed authenticated user with low balance (e.g., $5.00)
    const user = {
      client_id: 'client-1',
      ewallet: '500',
      firstname: 'Test',
      lastname: 'User',
      phone: '+1234567890',
    }
    queryClient.setQueryData(['self'], user)
    api.auth.self.mockResolvedValue(user)

    // Seed a product priced at $10.00 (1000 cents)
    const productId = 'prod-1'
    const productData = {
      product_id: productId,
      product_name: 'Latte',
      category_name: 'Coffee',
      price: { default: '1000' },
    }
    queryClient.setQueryData(productQueryOptions(productId).queryKey, productData)

    // Add item to order
    const { result: addItemResult } = renderHookWithClient(() => useAddItem())
    act(() => {
      addItemResult.current({ id: productId, quantity: 1 })
    })

    // Render screen
    const screen = renderWithClient(<OrderDetail />)

    // Submit order
    const submitButton = await screen.findByText('Submit Order')
    fireEvent.press(submitButton)

    // Assert alert shown and API not called
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled()
    })

    expect(api.orders.create).not.toHaveBeenCalled()
  })
})

