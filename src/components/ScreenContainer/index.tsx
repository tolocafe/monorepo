import type { ComponentProps, RefObject } from 'react'
import { ScrollView, View } from 'react-native'

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { StyleSheet } from 'react-native-unistyles'

export type Props = ComponentProps<typeof ScrollView> & {
	keyboardAware?: boolean
	noScroll?: boolean
	ref?: RefObject<null | ScrollView>
}

export function ScreenContainer({
	children,
	contentInsetAdjustmentBehavior = 'automatic',
	keyboardAware = false,
	noScroll = false,
	ref,
	style,
	...rest
}: Props) {
	if (noScroll) {
		return (
			<View {...rest} style={[styles.container, style]}>
				{children}
			</View>
		)
	}

	if (keyboardAware) {
		return (
			<KeyboardAwareScrollView
				automaticallyAdjustsScrollIndicatorInsets
				contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
				keyboardDismissMode="interactive"
				keyboardShouldPersistTaps="handled"
				ref={ref}
				style={[styles.container, style]}
				{...rest}
			>
				{children}
			</KeyboardAwareScrollView>
		)
	}

	return (
		<ScrollView
			contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
			ref={ref}
			style={[styles.container, style]}
			{...rest}
		>
			{children}
		</ScrollView>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		backgroundColor: theme.colors.background,
		flex: 1,
	},
}))

export default ScreenContainer
