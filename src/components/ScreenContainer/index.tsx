import type { ComponentProps, RefObject } from 'react'
import { Platform, ScrollView, View } from 'react-native'

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import {
	StyleSheet,
	UnistylesRuntime,
	withUnistyles,
} from 'react-native-unistyles'

import HeaderGradient from '@/components/HeaderGradient'

const DEFAULT_PADDING_EDGES = ['bottom', 'left', 'right', 'top'] as const

export type Props = Omit<
	ComponentProps<typeof ScrollView>,
	'contentInsetAdjustmentBehavior'
> & {
	keyboardAware?: boolean
	noScroll?: boolean
	ref?: RefObject<null | ScrollView>
	/**
	 * The edges to apply padding to.
	 * @default ['bottom', 'left', 'right', 'top']
	 */
	withPaddingEdges?: readonly (typeof DEFAULT_PADDING_EDGES)[number][]
	withTopGradient?: boolean
}

const UniScrollView = withUnistyles(ScrollView)
const UniKeyboardAwareScrollView = withUnistyles(KeyboardAwareScrollView)

export default function ScreenContainer({
	children,
	contentContainerStyle,
	keyboardAware = false,
	noScroll = false,
	ref,
	style,
	withPaddingEdges = DEFAULT_PADDING_EDGES,
	withTopGradient,
	...rest
}: Props) {
	const topAccessory = withTopGradient ? <HeaderGradient /> : null

	styles.useVariants({
		withBottomPadding: withPaddingEdges.includes('bottom'),
		withLeftPadding: withPaddingEdges.includes('left'),
		withRightPadding: withPaddingEdges.includes('right'),
		withTopPadding: withPaddingEdges.includes('top'),
	})

	if (noScroll) {
		return (
			<>
				{topAccessory}
				<View {...rest} style={[styles.container, contentContainerStyle]}>
					{children}
				</View>
			</>
		)
	}

	if (keyboardAware) {
		return (
			<>
				{topAccessory}
				<UniKeyboardAwareScrollView
					automaticallyAdjustsScrollIndicatorInsets
					contentContainerStyle={[
						styles.contentContainer,
						contentContainerStyle,
					]}
					keyboardDismissMode="interactive"
					keyboardShouldPersistTaps="handled"
					ref={ref}
					style={[styles.scrollViewContainer, style]}
					{...rest}
				>
					{children}
				</UniKeyboardAwareScrollView>
			</>
		)
	}

	return (
		<>
			{topAccessory}
			<UniScrollView
				contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
				ref={ref}
				style={[styles.scrollViewContainer, style]}
				{...rest}
			>
				{children}
			</UniScrollView>
		</>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	container: {
		backgroundColor: theme.colors.crema.background,
		flex: 1,
		variants: {
			withTopPadding: {
				true: {
					paddingTop:
						Platform.OS === 'ios'
							? 0
							: Math.max(theme.spacing.sm, UnistylesRuntime.insets.top),
				},
			},
		},
	},
	contentContainer: {
		flexGrow: 1,
		paddingBottom: Math.max(runtime.insets.bottom, theme.layout.screenPadding),
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
		paddingTop: Math.max(runtime.insets.top, theme.layout.screenPadding),
		variants: {
			withBottomPadding: {
				false: {
					paddingBottom: 0,
				},
			},
			withLeftPadding: {
				false: {
					paddingLeft: 0,
				},
			},
			withRightPadding: {
				false: {
					paddingRight: 0,
				},
			},
			withTopPadding: {
				false: {
					paddingTop: 0,
				},
			},
		},
	},
	scrollViewContainer: {
		backgroundColor: theme.colors.crema.background,
	},
}))
