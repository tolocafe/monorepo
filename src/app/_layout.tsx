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
import { isStaticWeb } from '@/lib/constants/is-static-web'
import { useColorScheme } from '@/lib/hooks/use-color-scheme'
import { useUpdates } from '@/lib/hooks/use-updates'
import { useWidgetSync } from '@/lib/hooks/use-widget-sync'
import '@/lib/analytics/firebase/init'
import '@/lib/locales/init'
import { QueryProvider } from '@/lib/providers/query-provider'
import { selfQueryOptions } from '@/lib/queries/auth'
import { coffeesQueryOptions } from '@/lib/queries/coffees'
import {
	categoriesQueryOptions,
	productsQueryOptions,
} from '@/lib/queries/menu'
import { orderQueryOptions } from '@/lib/queries/order'
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
		if (isStaticWeb) {
			return
		}
		navigationIntegration.registerNavigationContainer(ref)
	}, [ref])

	// Prefetch critical data at app mount
	useEffect(() => {
		if (isStaticWeb) {
			return
		}

		void Promise.allSettled([
			queryClient.prefetchQuery(selfQueryOptions),
			queryClient.prefetchQuery(orderQueryOptions),
			queryClient.prefetchQuery(coffeesQueryOptions),
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
					<Widget />
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

function Widget() {
	// Sync data to widget
	useWidgetSync()

	return null
}

export default Sentry.wrap(RootLayout)
