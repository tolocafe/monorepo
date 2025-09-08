import { useEffect } from 'react'
import { Platform } from 'react-native'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native'
import * as Sentry from '@sentry/react-native'
import { Toaster } from 'burnt/web'
import * as Notifications from 'expo-notifications'
import { Stack, useNavigationContainerRef } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { KeyboardProvider } from 'react-native-keyboard-controller'

import { FacebookPixel } from '@/lib/analytics/facebook-pixel'
import { useColorScheme } from '@/lib/hooks/use-color-scheme'
import { useUpdates } from '@/lib/hooks/use-updates'
import '@/lib/analytics/firebase/init'
import '@/lib/locales/init'
import { QueryProvider } from '@/lib/providers/query-provider'
import {
	categoriesQueryOptions,
	productsQueryOptions,
} from '@/lib/queries/menu'
import { queryClient } from '@/lib/query-client'

const navigationIntegration = Sentry.reactNavigationIntegration({
	enableTimeToInitialDisplay: true,
})

export const unstable_settings = {
	initialRouteName: '(tabs)',
}

Notifications.setNotificationHandler({
	// eslint-disable-next-line @typescript-eslint/require-await
	handleNotification: async () => ({
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
})

function RootLayout() {
	const colorScheme = useColorScheme()
	const ref = useNavigationContainerRef()
	const updates = useUpdates()

	useEffect(() => {
		navigationIntegration.registerNavigationContainer(ref)
	}, [ref])

	// Capture update errors to Sentry instead of console logs
	useEffect(() => {
		void Promise.allSettled([
			queryClient.prefetchQuery(productsQueryOptions),
			queryClient.prefetchQuery(categoriesQueryOptions),
		])

		if (updates.error) {
			Sentry.captureMessage('Update process completed with error', {
				extra: {
					channel: updates.channel,
					error: updates.error,
					runtimeVersion: updates.runtimeVersion,
					updateId: updates.updateId,
				},
				level: 'error',
				tags: {
					feature: 'expo-updates',
					operation: 'updateStatus',
				},
			})
		}
	}, [updates.channel, updates.error, updates.runtimeVersion, updates.updateId])

	return (
		<KeyboardProvider>
			<QueryProvider>
				<ThemeProvider
					value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
				>
					<StatusBar style="auto" />
					<FacebookPixel />
					<I18nProvider i18n={i18n}>
						<Stack initialRouteName="(tabs)">
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen name="+not-found" />
							<Stack.Screen
								name="sign-in"
								options={{
									presentation: Platform.select({
										default: 'modal',
										web: 'transparentModal',
									}),
								}}
							/>
						</Stack>
						<Toaster position="bottom-right" />
					</I18nProvider>
				</ThemeProvider>
			</QueryProvider>
		</KeyboardProvider>
	)
}

export default Sentry.wrap(RootLayout)
