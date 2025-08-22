import type { ComponentProps, RefObject } from 'react'
import { Platform, ScrollView, View } from 'react-native'

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'

import HeaderGradient from '@/components/HeaderGradient'

export type Props = ComponentProps<typeof ScrollView> & {
	keyboardAware?: boolean
	noScroll?: boolean
	ref?: RefObject<null | ScrollView>
	withTopGradient?: boolean
	withTopPadding?: boolean
}

export function ScreenContainer({
	children,
	contentContainerStyle,
	contentInsetAdjustmentBehavior = 'automatic',
	keyboardAware = false,
	noScroll = false,
	ref,
	style,
	withTopGradient,
	withTopPadding,
	...rest
}: Props) {
	const topAccessory = withTopGradient ? <HeaderGradient /> : null

	styles.useVariants({ withTopPadding })

	if (noScroll) {
		return (
			<>
				{topAccessory}
				<View {...rest} style={[styles.container, style]}>
					{children}
				</View>
			</>
		)
	}

	if (keyboardAware) {
		return (
			<>
				{topAccessory}
				<KeyboardAwareScrollView
					automaticallyAdjustsScrollIndicatorInsets
					contentContainerStyle={[
						styles.contentContainer,
						contentContainerStyle,
					]}
					contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
					keyboardDismissMode="interactive"
					keyboardShouldPersistTaps="handled"
					ref={ref}
					style={[styles.container, style]}
					{...rest}
				>
					{children}
				</KeyboardAwareScrollView>
			</>
		)
	}

	return (
		<>
			{topAccessory}
			<ScrollView
				contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
				contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
				ref={ref}
				style={[styles.container, style]}
				{...rest}
			>
				{children}
			</ScrollView>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		backgroundColor: theme.colors.background,
		flex: 1,
	},
	contentContainer: {
		variants: {
			withTopPadding: {
				true: {
					paddingTop: Platform.OS === 'ios' ? 0 : UnistylesRuntime.insets.top,
				},
			},
		},
	},
}))

export default ScreenContainer
