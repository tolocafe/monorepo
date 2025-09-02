import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { api } from '@/lib/services/api-service'

import type { ClientData } from '@/lib/api'

export type RequestOtpMutationOptions = {
	birthdate?: string
	email?: string
	name?: string
	phone: string
}

export const requestOtpMutationOptions = mutationOptions({
	mutationFn: (body: RequestOtpMutationOptions) => api.auth.requestOtp(body),
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

export const sessionsQueryOptions = queryOptions({
	queryFn: () => api.auth.sessions(),
	queryKey: ['auth', 'sessions'],
})
