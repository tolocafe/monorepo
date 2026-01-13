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
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'

import { AnalyticsIdentifier } from '@/lib/analytics/components/analytics-identifier'
import '@/lib/locales/init'
import { PostHogProvider } from '@/lib/analytics/posthog'
import { isStaticWeb } from '@/lib/constants/is-static-web'
import { useColorScheme } from '@/lib/hooks/use-color-scheme'
import { useUpdates } from '@/lib/hooks/use-updates'
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

if (Platform.OS !== 'web') {
	Notifications.setNotificationHandler({
		// eslint-disable-next-line @typescript-eslint/require-await
		handleNotification: async () => ({
			shouldPlaySound: true,
			shouldSetBadge: true,
			shouldShowBanner: true,
			shouldShowList: true,
		}),
	})
}

const modalOptions = {
	headerShown: true,
	headerTransparent: Platform.select({ android: false, default: true }),
	presentation: Platform.select({
		default: 'modal' as const,
		web: 'transparentModal' as const,
	}),
} as const

const defaultStackScreenOptions: Parameters<typeof Stack.Screen>[0]['options'] =
	{ headerShown: false }

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
					<AnalyticsIdentifier />
					<StatusBar style="auto" />
					<I18nProvider i18n={i18n}>
						<PostHogProvider>
							<Stack
								screenOptions={defaultStackScreenOptions}
								initialRouteName="(tabs)"
							>
								<Stack.Screen name="(tabs)" />
								<Stack.Screen name="+not-found" />
								<Stack.Screen
									name="products/[id]"
									options={{ ...modalOptions, headerTitle: '' }}
								/>
								<Stack.Screen
									name="tables/[location_id]/[table_id]"
									options={modalOptions}
								/>
								<Stack.Screen name="sign-in" options={modalOptions} />
								<Stack.Screen name="orders/current" options={modalOptions} />
								<Stack.Screen name="promotions/[id]" options={modalOptions} />
								<Stack.Screen name="events/[id]" options={modalOptions} />
								<Stack.Screen name="blog/[id]" options={modalOptions} />
								<Stack.Screen
									name="coffees/[id]"
									options={{
										...modalOptions,
										animation: 'none',
										header: () => null,
										presentation: 'transparentModal',
									}}
								/>
							</Stack>
							<Toaster position="bottom-right" />
						</PostHogProvider>
					</I18nProvider>
				</ThemeProvider>
			</QueryProvider>
		</KeyboardProvider>
	)
}

export default Sentry.wrap(RootLayout)
