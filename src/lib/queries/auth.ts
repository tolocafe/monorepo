import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

import type { ClientData } from '@/lib/api'

type RequestOtpMutationOptions = {
	email?: string
	name?: string
	phone: string
}

export const requestOtpMutationOptions = mutationOptions({
	mutationFn: ({ email, name, phone }: RequestOtpMutationOptions) =>
		api.auth.requestOtp(phone, name, email),
})

type VerifyOtpMutationOptions = {
	code: string
	phone: string
	sessionName: string
}

export const verifyOtpMutationOptions = mutationOptions({
	mutationFn: ({ code, phone, sessionName }: VerifyOtpMutationOptions) =>
		api.auth.verifyOtp(phone, code, sessionName),
})

export const selfQueryOptions = queryOptions({
	queryFn: () => api.auth.self(),
	queryKey: ['self'],
})

export const updateClientMutationOptions = (clientId: string) =>
	mutationOptions<ClientData, Error, Record<string, unknown>>({
		mutationFn: (data) => api.client.update(clientId, data),
		mutationKey: ['client', clientId],
	})

export const updateClientPushTokensMutationOptions = (clientId: string) =>
	mutationOptions<ClientData, Error, string>({
		mutationFn: (token) => api.client.updatePushTokens(clientId, token),
		mutationKey: ['client', clientId, 'push-tokens'],
	})

export const signOutMutationOptions = mutationOptions({
	mutationFn: () => api.auth.signOut(),
	mutationKey: ['auth', 'sign-out'],
})
