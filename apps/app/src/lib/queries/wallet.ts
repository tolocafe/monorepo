import { mutationOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

export type TopUpEWalletRequest = {
	amount: number // Amount in cents
}

export type TopUpEWalletResponse = {
	ephemeralKey: string
	paymentIntent: {
		client_secret: string
	}
}

export const topUpEWalletMutationOptions = mutationOptions({
	mutationFn: (data: TopUpEWalletRequest) => api.wallet.topUp(data),
})
