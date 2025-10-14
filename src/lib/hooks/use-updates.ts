import { useEffect, useState } from 'react'

import * as Sentry from '@sentry/react-native'
import * as Updates from 'expo-updates'

export type UpdateState = {
	error: null | string
	isChecking: boolean
	isDownloading: boolean
	isUpdateAvailable: boolean
}

export function useUpdates() {
	const [state, setState] = useState<UpdateState>({
		error: null,
		isChecking: false,
		isDownloading: false,
		isUpdateAvailable: false,
	})

	const checkForUpdates = async () => {
		if (!Updates.isEnabled || __DEV__) {
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
	}

	const reloadApp = async () => {
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
	}

	// Check for updates on mount
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void checkForUpdates()
	}, [])

	return {
		...state,
		channel: Updates.channel,
		checkForUpdates,
		createdAt: Updates.createdAt,
		reloadApp,
		runtimeVersion: Updates.runtimeVersion,
		updateId: Updates.updateId,
	}
}
