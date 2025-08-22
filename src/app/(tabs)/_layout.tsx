import type { ImageSourcePropType } from 'react-native'
import { Platform } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react/macro'
import Head from 'expo-router/head'

import Tabs from '@/components/Tabs'
import { Colors } from '@/lib/constants/colors'
import { useColorScheme } from '@/lib/hooks/use-color-scheme'
import { useOrderStats } from '@/lib/stores/order-store'

export default function TabLayout() {
	const colorScheme = useColorScheme()
	const { t } = useLingui()
	const { totalItems } = useOrderStats()

	return (
		<>
			<Head>
				<meta content="true" property="expo:handoff" />
			</Head>
			<Tabs
				activeIndicatorColor={Colors[colorScheme ?? 'light'].tint}
				minimizeBehavior="automatic"
				rippleColor={Colors[colorScheme ?? 'light'].tint}
				screenOptions={{
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore - bottom-tabs library has incomplete type definitions
					headerShown: false,
					minimizeBehavior: 'automatic',
					tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
				}}
				tabBarStyle={{
					backgroundColor:
						Platform.OS === 'android'
							? Colors[colorScheme ?? 'light'].background
							: undefined,
				}}
				translucent
			>
				<Tabs.Screen
					name="(home)"
					options={{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon: ({ focused }: { focused: boolean }) => {
							if (Platform.OS === 'ios') {
								return { sfSymbol: 'house' }
							}

							if (Platform.OS === 'android') {
								return (
									focused
										? require('@/assets/icons/home.svg')
										: require('@/assets/icons/home-outline.svg')
								) as ImageSourcePropType
							}

							return (
								<Ionicons
									color={
										focused
											? Colors[colorScheme ?? 'light'].tint
											: Colors[colorScheme ?? 'light'].tabIconDefault
									}
									name={focused ? 'restaurant' : 'restaurant-outline'}
									size={24}
								/>
							)
						},
						title: t`Home`,
					}}
				/>
				<Tabs.Screen
					name="orders"
					options={{
						tabBarBadge: totalItems > 0 ? totalItems.toString() : undefined,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon({ focused }: { focused: boolean }) {
							if (Platform.OS === 'ios') {
								return { sfSymbol: 'bag' }
							}

							if (Platform.OS === 'android') {
								return (
									focused
										? require('@/assets/icons/receipt.svg')
										: require('@/assets/icons/receipt-outline.svg')
								) as ImageSourcePropType
							}

							return (
								<Ionicons
									color={
										focused
											? Colors[colorScheme ?? 'light'].tint
											: Colors[colorScheme ?? 'light'].tabIconDefault
									}
									name={focused ? 'receipt' : 'receipt-outline'}
									size={24}
								/>
							)
						},
						title: t`Orders`,
					}}
				/>
				<Tabs.Screen
					name="more"
					options={{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon: ({ focused }: { focused: boolean }) => {
							if (Platform.OS === 'ios') {
								return { sfSymbol: 'ellipsis' }
							}

							if (Platform.OS === 'android') {
								return require('@/assets/icons/more.svg') as ImageSourcePropType
							}

							return (
								<Ionicons
									color={
										focused
											? Colors[colorScheme ?? 'light'].tint
											: Colors[colorScheme ?? 'light'].tabIconDefault
									}
									name="ellipsis-horizontal"
									size={24}
								/>
							)
						},
						title: t`More`,
					}}
				/>
			</Tabs>
		</>
	)
}
