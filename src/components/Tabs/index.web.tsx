import { type ComponentProps, useEffect, useMemo, useState } from 'react'
import type { ImageSourcePropType } from 'react-native'
import { Pressable, Text, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react/macro'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Image } from 'expo-image'
import { Link, withLayoutContext } from 'expo-router'
import {
	type TabTriggerSlotProps,
	TabList as UITabList,
	Tabs as UITabs,
	TabSlot as UITabSlot,
	TabTrigger as UITabTrigger,
} from 'expo-router/ui'
import { StyleSheet } from 'react-native-unistyles'

import type { BottomTabNavigatorProps } from '@react-navigation/bottom-tabs'

import { breakpoints } from '@/lib/styles/unistyles'

const DefaultBottomTabs = createBottomTabNavigator()
const ExpoDefaultBottomTabs = withLayoutContext(DefaultBottomTabs.Navigator)

const DESKTOP_MIN_WIDTH = breakpoints.lg
const getWindowWidth = () => globalThis.window.innerWidth

type IoniconName = ComponentProps<typeof Ionicons>['name']

type SideTabButtonProps = TabTriggerSlotProps & {
	icon: IoniconName
	label: string
}

function DesktopSideTabs() {
	const { t } = useLingui()

	return (
		<UITabs>
			{/* Main content area */}
			<View style={styles.contentArea}>
				<UITabSlot />
			</View>

			{/* Left sidebar with triggers */}
			<UITabList asChild>
				<View style={styles.sidebar}>
					<Link href="/">
						<Image
							contentFit="contain"
							source={
								require('@/assets/images/header.png') as ImageSourcePropType
							}
							style={{ height: 25, marginBottom: 10, width: 100 }}
						/>
					</Link>
					<UITabTrigger asChild href="/" name="home">
						<SideTabButton icon="restaurant-outline" label={t`Home`} />
					</UITabTrigger>
					<UITabTrigger asChild href="/orders" name="orders">
						<SideTabButton icon="receipt-outline" label={t`Orders`} />
					</UITabTrigger>
					<UITabTrigger asChild href="/more" name="more">
						<SideTabButton icon="ellipsis-horizontal" label={t`More`} />
					</UITabTrigger>
				</View>
			</UITabList>
		</UITabs>
	)
}

function SideTabButton({
	icon,
	isFocused,
	label,
	ref,
	...rest
}: SideTabButtonProps) {
	return (
		<Pressable
			{...rest}
			accessibilityRole="tab"
			accessibilityState={{ selected: Boolean(isFocused) }}
			ref={ref}
			style={[
				styles.tabButton,
				isFocused ? styles.tabButtonFocused : undefined,
			]}
		>
			<Ionicons
				color={
					isFocused
						? styles.tabButtonLabelFocused.color
						: styles.tabButtonLabel.color
				}
				name={icon}
				size={20}
			/>
			<Text
				numberOfLines={1}
				style={[
					styles.tabButtonLabel,
					isFocused ? styles.tabButtonLabelFocused : undefined,
				]}
			>
				{label}
			</Text>
		</Pressable>
	)
}

function throttle<T extends (...arguments_: unknown[]) => void>(
	function_: T,
	wait = 150,
) {
	let lastTime = 0
	let timeout: null | ReturnType<typeof setTimeout> = null
	let lastArguments: Parameters<T>
	return (...arguments_: Parameters<T>) => {
		const now = Date.now()
		lastArguments = arguments_
		const remaining = wait - (now - lastTime)

		if (remaining <= 0) {
			if (timeout) {
				clearTimeout(timeout)
				timeout = null
			}
			lastTime = now
			function_(...arguments_)
		} else {
			timeout ??= setTimeout(() => {
				lastTime = Date.now()
				timeout = null
				function_(...lastArguments)
			}, remaining)
		}
	}
}

function useIsDesktop() {
	const [width, setWidth] = useState<number>(getWindowWidth())

	const onResize = useMemo(
		() => throttle(() => setWidth(getWindowWidth()), 150),
		[],
	)

	useEffect(() => {
		globalThis.window.addEventListener('resize', onResize)
		return () => globalThis.window.removeEventListener('resize', onResize)
	}, [onResize])

	return width >= DESKTOP_MIN_WIDTH
}

const SIDEBAR_WIDTH = 280

const styles = StyleSheet.create((theme) => ({
	contentArea: {
		backgroundColor: theme.colors.background,
		flex: 1,
		paddingLeft: SIDEBAR_WIDTH,
	},
	sidebar: {
		backgroundColor: theme.colors.surface,
		borderRightColor: theme.colors.border,
		borderRightWidth: 1,
		bottom: 0,
		gap: theme.spacing.sm,
		left: 0,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		position: 'absolute',
		top: 0,
		width: SIDEBAR_WIDTH,
	},
	tabButton: {
		alignItems: 'center',
		borderRadius: theme.borderRadius.md,
		flexDirection: 'row',
		gap: theme.spacing.md,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.md,
	},
	tabButtonFocused: {
		backgroundColor: theme.colors.background,
	},
	tabButtonLabel: {
		color: theme.colors.textTertiary,
		fontSize: theme.fontSizes.md,
		fontWeight: theme.fontWeights.medium,
	},
	tabButtonLabelFocused: {
		color: theme.colors.primary,
	},
}))

type ExpoTabsType = typeof ExpoDefaultBottomTabs

type ResponsiveTabsWithScreen = typeof ResponsiveTabs & {
	Screen: ExpoTabsType['Screen']
}

function ResponsiveTabs(config: Omit<BottomTabNavigatorProps, 'id'>) {
	const isDesktop = useIsDesktop()
	if (isDesktop) return <DesktopSideTabs />
	return <ExpoDefaultBottomTabs {...config} />
}

const Tabs = ResponsiveTabs as unknown as ResponsiveTabsWithScreen
Tabs.Screen = ExpoDefaultBottomTabs.Screen

export default Tabs
