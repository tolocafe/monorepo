import { type ComponentProps, useEffect, useMemo, useState } from 'react'
import type { ImageSourcePropType } from 'react-native'
import { Pressable, Text, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react/macro'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Image } from 'expo-image'
import { Link, withLayoutContext } from 'expo-router'
import {
	TabList as UITabList,
	Tabs as UITabs,
	TabSlot as UITabSlot,
	TabTrigger as UITabTrigger,
} from 'expo-router/ui'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import type { BottomTabNavigatorProps } from '@react-navigation/bottom-tabs'
import type { TabTriggerSlotProps } from 'expo-router/ui'

import { isStaticWeb } from '@/lib/constants/is-static-web'
import { breakpoints } from '@/lib/styles/unistyles'

const DefaultBottomTabs = createBottomTabNavigator()
const ExpoDefaultBottomTabs = DefaultBottomTabs.Navigator

const DESKTOP_MIN_WIDTH = breakpoints.lg
const getWindowWidth = () => (isStaticWeb ? 0 : globalThis.window.innerWidth)

type IoniconName = ComponentProps<typeof Ionicons>['name']

type SideTabButtonProps = TabTriggerSlotProps & {
	icon: IoniconName
	label: string
}

const UniImage = withUnistyles(Image)

function DesktopSideTabs(_config: Omit<BottomTabNavigatorProps, 'id'>) {
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
						<UniImage
							contentFit="contain"
							source={
								require('@/assets/images/header.png') as ImageSourcePropType
							}
							style={styles.image}
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
	styles.useVariants({
		isFocused,
	})

	return (
		<Pressable
			{...rest}
			accessibilityRole="tab"
			accessibilityState={{ selected: Boolean(isFocused) }}
			ref={ref}
			style={styles.tabButton}
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
		// eslint-disable-next-line unicorn/no-typeof-undefined
		if (typeof globalThis.window === 'undefined') return

		globalThis.window.addEventListener('resize', onResize)
		return () => globalThis.window.removeEventListener('resize', onResize)
	}, [onResize])

	return width >= DESKTOP_MIN_WIDTH
}

const SIDEBAR_WIDTH = 280

const styles = StyleSheet.create((theme) => ({
	contentArea: {
		backgroundColor: theme.colors.gray.background,
		flex: 1,
		paddingLeft: SIDEBAR_WIDTH,
	},
	image: { height: 25, marginBottom: 10, width: 100 },
	sidebar: {
		backgroundColor: theme.colors.gray.background,
		borderRightColor: theme.colors.gray.border,
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
		_web: {
			_hover: {
				backgroundColor: theme.colors.gray.border,
			},
		},
		alignItems: 'center',
		borderRadius: theme.borderRadius.md,
		flexDirection: 'row',
		gap: theme.spacing.md,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.md,
		variants: {
			isFocused: {
				true: {
					backgroundColor: theme.colors.gray.border,
				},
			},
		},
	},
	tabButtonLabel: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.md,
		fontWeight: theme.fontWeights.medium,
	},
	tabButtonLabelFocused: {
		color: theme.colors.verde.solid,
	},
}))

function ResponsiveTabs(config: Omit<BottomTabNavigatorProps, 'id'>) {
	const isDesktop = useIsDesktop()

	if (isDesktop) {
		return <DesktopSideTabs {...config} />
	}

	return <ExpoDefaultBottomTabs {...config} />
}

export default withLayoutContext(ResponsiveTabs)
