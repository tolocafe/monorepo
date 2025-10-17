import { useCallback, useEffect, useState } from 'react'

import * as Sentry from '@sentry/react-native'

import ExpoSharedStorage from '~/modules/expo-shared-storage'

export type UpdateState = {
	error: null | string
	isChecking: boolean
	isDownloading: boolean
	isEnabled: boolean | null
	isUpdateAvailable: boolean
}

type UpdatesModule = {
	channel: string
	checkForUpdateAsync: () => Promise<{ isAvailable: boolean }>
	createdAt: Date | null
	fetchUpdateAsync: () => Promise<unknown>
	isEnabled: boolean
	reloadAsync: () => Promise<void>
	runtimeVersion: string
	updateId: string
}

export function useUpdates() {
	const [state, setState] = useState<UpdateState>({
		error: null,
		isChecking: false,
		isDownloading: false,
		isEnabled: null,
		isUpdateAvailable: false,
	})

	const checkForUpdates = useCallback(async () => {
		const Updates = await getUpdatesModule()

		if (!Updates || !Updates.isEnabled || __DEV__) {
			return
		}

		try {
			setState((previous) => ({ ...previous, error: null, isChecking: true }))

			const update = await Updates.checkForUpdateAsync()

			setState((previous) => ({
				...previous,
				isChecking: false,
				isUpdateAvailable: update.isAvailable,
			}))

			if (update.isAvailable) {
				setState((previous) => ({ ...previous, isDownloading: true }))
				await Updates.fetchUpdateAsync()
				setState((previous) => ({ ...previous, isDownloading: false }))
				// Automatically reload the app with the new update
				await Updates.reloadAsync()
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error occurred'

			// Capture error to Sentry
			Sentry.captureException(error, {
				extra: {
					channel: Updates.channel,
					runtimeVersion: Updates.runtimeVersion,
					updateId: Updates.updateId,
				},
				tags: {
					feature: 'expo-updates',
					operation: 'checkForUpdates',
				},
			})

			setState((previous) => ({
				...previous,
				error: errorMessage,
				isChecking: false,
				isDownloading: false,
			}))
		}
	}, [])

	const reloadApp = useCallback(async () => {
		const Updates = await getUpdatesModule()

		if (!Updates) {
			return
		}

		try {
			await Updates.reloadAsync()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to reload app'

			// Capture error to Sentry
			Sentry.captureException(error, {
				extra: {
					channel: Updates.channel,
					runtimeVersion: Updates.runtimeVersion,
					updateId: Updates.updateId,
				},
				tags: {
					feature: 'expo-updates',
					operation: 'reloadApp',
				},
			})

			setState((previous) => ({
				...previous,
				error: errorMessage,
			}))
		}
	}, [])

	// Check for updates on mount
	useEffect(() => {
		if (ExpoSharedStorage.isAppClip) {
			return
		}

		// Async call doesn't actually cause cascading renders
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void checkForUpdates()
	}, [checkForUpdates])

	if (ExpoSharedStorage.isAppClip) {
		return {
			...state,
			channel: 'app-clip',
			checkForUpdates,
			createdAt: null,
			reloadApp,
			runtimeVersion: '0.0.0',
			updateId: '0.0.0',
		}
	}

	return {
		...state,
		channel: null,
		checkForUpdates,
		createdAt: null,
		reloadApp,
		runtimeVersion: null,
		updateId: null,
	}
}

async function getUpdatesModule() {
	if (ExpoSharedStorage.isAppClip) {
		return null
	}

	return import('expo-updates') as Promise<null | UpdatesModule>
}
