import type { ComponentProps } from 'react'
import { View, Platform, ScrollView } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { isIOS20, ORDER_BUTTON_HEIGHT } from '~/lib/constants/ui'
import { useHasActiveOrder } from '~/lib/stores/order-store'

import HeaderGradient from '../HeaderGradient'

const DEFAULT_PADDING_EDGES =
	Platform.OS === 'ios'
		? isIOS20
			? (['bottom', 'left', 'right'] as const)
			: (['bottom', 'left', 'right', 'top'] as const)
		: (['bottom', 'left', 'right', 'top'] as const)

export type Props = ComponentProps<typeof ScrollView> & {
	keyboardAware?: boolean
	noScroll?: boolean
	/**
	 * The edges to apply padding to.
	 * @default ['bottom', 'left', 'right', 'top']
	 */
	withPaddingEdges?: readonly (typeof DEFAULT_PADDING_EDGES)[number][]
}

const UniScrollView = withUnistyles(ScrollView)
const UniKeyboardAwareScrollView = withUnistyles(KeyboardAwareScrollView)

const topAccessory = Platform.OS === 'web' ? <HeaderGradient /> : null

export default function ScreenContainer({
	contentInsetAdjustmentBehavior = 'automatic',
	children,
	contentContainerStyle,
	keyboardAware = false,
	noScroll = false,
	style,
	withPaddingEdges = DEFAULT_PADDING_EDGES,
	...rest
}: Props) {
	const hasActiveOrder = useHasActiveOrder()

	styles.useVariants({
		withBottomPadding: withPaddingEdges.includes('bottom'),
		withLeftPadding: withPaddingEdges.includes('left'),
		withOrderPadding: hasActiveOrder && Platform.OS !== 'ios',
		withRightPadding: withPaddingEdges.includes('right'),
		withTopPadding: withPaddingEdges.includes('top'),
	})

	if (noScroll) {
		return (
			<>
				{topAccessory}
				<View
					// oxlint-disable-next-line jsx-props-no-spreading
					{...rest}
					style={[
						styles.scrollViewContainer,
						styles.contentContainer,
						styles.contentNoScroll,
						contentContainerStyle,
					]}
				>
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
					contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
					contentContainerStyle={[
						styles.contentContainer,
						contentContainerStyle,
					]}
					keyboardDismissMode="interactive"
					keyboardShouldPersistTaps="handled"
					style={[styles.scrollViewContainer, style]}
					// oxlint-disable-next-line jsx-props-no-spreading
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
				contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
				contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
				style={[styles.scrollViewContainer, style]}
				// oxlint-disable-next-line jsx-props-no-spreading
				{...rest}
			>
				{children}
			</UniScrollView>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	contentContainer: {
		paddingBottom: theme.layout.screenPadding,
		paddingLeft: theme.layout.screenPadding,
		paddingRight: theme.layout.screenPadding,
		paddingTop: Platform.OS === 'web' ? 80 : theme.layout.screenPadding,
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
			withOrderPadding: {
				true: {
					paddingBottom: theme.layout.screenPadding + ORDER_BUTTON_HEIGHT,
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
	contentNoScroll: {
		flex: 1,
	},
	scrollViewContainer: {
		backgroundColor: theme.colors.gray.border,
	},
}))
