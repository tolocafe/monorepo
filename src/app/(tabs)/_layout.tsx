import type { ImageSourcePropType } from 'react-native'
import { Platform, Pressable } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react/macro'
import Head from 'expo-router/head'
import { useUnistyles } from 'react-native-unistyles'

import Tabs, { useBottomTabBarHeight } from '@/components/Tabs'
import { useIsBarista } from '@/lib/hooks/use-is-barista'
import { useCurrentOrder } from '@/lib/stores/order-store'
import { View } from 'react-native'
import { Text } from '@/components/Text'
import { Link } from 'expo-router'

export const unstable_settings = {
	initialRouteName: '(home)',
}

function CurrentOrderBanner({ isFloating }: { isFloating?: boolean }) {
	const currentOrder = useCurrentOrder()
	// const bottomHeight = useBottomTabBarHeight()

	// if (!currentOrder) return null

	return (
		<Link href="/orders/current" asChild>
			<Pressable
				style={{
					flex: 1,
					alignItems: 'center',
					flexDirection: 'row',
					paddingHorizontal: 20,
					justifyContent: 'space-between',
					...(isFloating
						? {
								flex: 0,
								position: 'absolute',
								bottom: Platform.OS === 'android' ? 100 : 0,
								left: 0,
								right: 0,
								width: '100%',
								minHeight: 65,
								backgroundColor: 'red',
							}
						: {}),
				}}
			>
				<Text>Current Order</Text>
				<Text>{currentOrder?.products?.length}</Text>
			</Pressable>
		</Link>
	)

	// return (
	// 	<View
	// 		style={{
	// 			position: 'absolute',
	// 			// bottom: bottomHeight,
	// 			left: 0,
	// 			right: 0,
	// 			backgroundColor: 'red',
	// 		}}
	// 	>
	// 		<Text>Current Order</Text>
	// 	</View>
	// )
}

export default function TabLayout() {
	const { t } = useLingui()

	const isBarista = useIsBarista()
	const { theme } = useUnistyles()

	return (
		<>
			<Head>
				<meta content="true" property="expo:handoff" />
			</Head>
			<>
				<Tabs
					activeIndicatorColor={Platform.select({
						android: theme.colors.verde.interactive,
						default: theme.colors.verde.solid,
					})}
					initialRouteName="(home)"
					labeled
					minimizeBehavior="onScrollDown"
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
					renderBottomAccessoryView={CurrentOrderBanner}
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
											focused
												? theme.colors.verde.solid
												: theme.colors.gray.solid
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
							sceneStyle: isBarista ? undefined : { display: 'none' },
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore - bottom-tabs library has incomplete type definitions
							tabBarIcon({ focused }: { focused: boolean }) {
								if (Platform.OS === 'ios') {
									return {
										sfSymbol: focused
											? 'list.clipboard.fill'
											: 'list.clipboard',
									}
								}

								if (Platform.OS === 'android') {
									return require('@/assets/icons/format-list.svg') as ImageSourcePropType
								}

								return (
									<Ionicons
										color={
											focused
												? theme.colors.verde.solid
												: theme.colors.gray.solid
										}
										name={focused ? 'list' : 'list-outline'}
										size={24}
									/>
								)
							},
							tabBarItemHidden: !isBarista,
							tabBarItemStyle: isBarista ? undefined : { display: 'none' }, // custom routers
							title: t`Team`,
						}}
					/>
					<Tabs.Screen
						name="account"
						options={{
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
											focused
												? theme.colors.verde.solid
												: theme.colors.gray.solid
										}
										name={focused ? 'person' : 'person-outline'}
										size={24}
									/>
								)
							},
							title: t`Account`,
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
											focused
												? theme.colors.verde.solid
												: theme.colors.gray.solid
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
				{Platform.OS !== 'ios' && <CurrentOrderBanner isFloating />}
			</>
		</>
	)
}
