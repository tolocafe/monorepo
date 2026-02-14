import NetInfo from '@react-native-community/netinfo'
import { focusManager, onlineManager } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AppState, Platform } from 'react-native'
import type { AppStateStatus } from 'react-native'

import { persister, persistMaxAge, queryClient } from '@/lib/query-client'

// Set up focus manager for React Native
if (Platform.OS !== 'web') {
	focusManager.setEventListener((handleFocus) => {
		const subscription = AppState.addEventListener(
			'change',
			(state: AppStateStatus) => {
				handleFocus(state === 'active')
			},
		)

		return () => {
			subscription.remove()
		}
	})

	// Set up online manager for React Native
	onlineManager.setEventListener((setOnline) =>
		NetInfo.addEventListener((state) => {
			setOnline(Boolean(state.isConnected))
		}),
	)
}

const persistOptions = {
	maxAge: persistMaxAge,
	persister,
}

type Props = {
	children: ReactNode
}

export function QueryProvider({ children }: Props) {
	// Initialize online status on mount
	useEffect(() => {
		if (Platform.OS !== 'web') {
			void NetInfo.fetch().then((state) =>
				onlineManager.setOnline(Boolean(state.isConnected)),
			)
		}
	}, [])

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={persistOptions}
		>
			{children}
		</PersistQueryClientProvider>
	)
}
