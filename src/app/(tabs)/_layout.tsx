import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react/macro'
import Head from 'expo-router/head'
import { Platform } from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import { useUnistyles } from 'react-native-unistyles'

import Tabs from '@/components/Tabs'
import { useIsBarista } from '@/lib/hooks/use-is-barista'
import { useCurrentOrderItemsCount } from '@/lib/stores/order-store'

// oxlint-disable-next-line only-export-components
export const unstable_settings = {
	initialRouteName: '(home)',
}

export default function TabLayout() {
	const { t } = useLingui()

	const itemsCount = useCurrentOrderItemsCount()
	const isBarista = useIsBarista()
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
				labeled
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
					backgroundColor: Platform.select({
						android: theme.colors.gray.background,
					}),
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
					name="team"
					options={{
						href: isBarista ? '/(tabs)/team' : null,
						sceneStyle: isBarista ? null : { display: 'none' },
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon({ focused }: { focused: boolean }) {
							if (Platform.OS === 'ios') {
								return {
									sfSymbol: focused ? 'person.3.fill' : 'person.3',
								}
							}

							if (Platform.OS === 'android') {
								return require('@/assets/icons/format-list.svg') as ImageSourcePropType
							}

							return (
								<Ionicons
									color={
										focused ? theme.colors.verde.solid : theme.colors.gray.solid
									}
									name={focused ? 'list' : 'list-outline'}
									size={24}
								/>
							)
						},
						tabBarItemHidden: !isBarista,
						tabBarItemStyle: isBarista ? null : { display: 'none' }, // custom routers
						title: t`Team`,
					}}
				/>
				<Tabs.Screen
					name="profile"
					options={{
						// oxlint-disable-next-line no-undefined
						tabBarBadge: itemsCount > 0 ? itemsCount.toString() : undefined,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore - bottom-tabs library has incomplete type definitions
						tabBarIcon({ focused }: { focused: boolean }) {
							if (Platform.OS === 'ios') {
								return { sfSymbol: focused ? 'person.fill' : 'person' }
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
									name={focused ? 'person' : 'person-outline'}
									size={24}
								/>
							)
						},
						title: t`Profile`,
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
