import type { ImageSourcePropType } from 'react-native'
import { Platform } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import Head from 'expo-router/head'
import { useUnistyles } from 'react-native-unistyles'

import Tabs from '@/components/Tabs'
import { selfQueryOptions } from '@/lib/queries/auth'
import { INTERNAL_GROUPS } from '@/lib/queries/order-log'
import { useCurrentOrderItemsCount } from '@/lib/stores/order-store'

export const unstable_settings = {
	initialRouteName: '(home)',
}

export default function TabLayout() {
	const { t } = useLingui()

	const itemsCount = useCurrentOrderItemsCount()
	const { data: user } = useQuery(selfQueryOptions)

	const isInternalUser = INTERNAL_GROUPS.has(Number(user?.client_groups_id))

	const { theme } = useUnistyles()

	return (
		<>
			<Head>
				<meta content="true" property="expo:handoff" />
			</Head>
			<Tabs
				activeIndicatorColor={Platform.select({
					android: theme.colors.verde.interactive,
					default: theme.colors.verde.solid,
				})}
				initialRouteName="(home)"
				minimizeBehavior="automatic"
				screenOptions={{
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore - bottom-tabs library has incomplete type definitions
					headerShown: false,
					minimizeBehavior: 'automatic',
					tabBarActiveTintColor: theme.colors.verde.solid,
				}}
				tabBarInactiveTintColor={theme.colors.gray.text}
				tabBarStyle={{
					backgroundColor:
						Platform.OS === 'android'
							? theme.colors.gray.background
							: undefined,
				}}
				translucent
			>
				<Tabs.Screen
					name="(home)"
					options={{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon({ focused }: { focused: boolean }) {
							if (Platform.OS === 'ios') {
								return { sfSymbol: focused ? 'house.fill' : 'house' }
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
										focused ? theme.colors.verde.solid : theme.colors.gray.solid
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
						tabBarBadge: itemsCount > 0 ? itemsCount.toString() : undefined,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon({ focused }: { focused: boolean }) {
							if (Platform.OS === 'ios') {
								return { sfSymbol: focused ? 'bag.fill' : 'bag' }
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
										focused ? theme.colors.verde.solid : theme.colors.gray.solid
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
					name="order-log"
					options={{
						href: isInternalUser ? undefined : null,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon({ focused }: { focused: boolean }) {
							if (Platform.OS === 'ios') {
								return {
									sfSymbol: focused ? 'list.clipboard.fill' : 'list.clipboard',
								}
							}

							return (
								<Ionicons
									color={
										focused ? theme.colors.verde.solid : theme.colors.gray.solid
									}
									name={focused ? 'clipboard' : 'clipboard-outline'}
									size={24}
								/>
							)
						},
						title: t`Log`,
					}}
				/>
				<Tabs.Screen
					name="more"
					options={{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon({ focused }: { focused: boolean }) {
							if (Platform.OS === 'ios') {
								return { sfSymbol: 'ellipsis' }
							}

							if (Platform.OS === 'android') {
								return require('@/assets/icons/more.svg') as ImageSourcePropType
							}

							return (
								<Ionicons
									color={
										focused ? theme.colors.verde.solid : theme.colors.gray.solid
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
