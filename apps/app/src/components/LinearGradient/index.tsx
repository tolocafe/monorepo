import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import type { LinearGradientProps as ExpoLinearGradientProps } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Platform, StyleSheet, View } from 'react-native'

type LinearGradientProps = ExpoLinearGradientProps

/**
 * Cross-platform LinearGradient component.
 * Uses expo-linear-gradient on native platforms and CSS gradients on web.
 */
export function LinearGradient({
	colors,
	end = { x: 0, y: 1 },
	start = { x: 0, y: 0 },
	style,
	...props
}: LinearGradientProps) {
	const ref = useRef<View>(null)

	useEffect(() => {
		if (Platform.OS === 'web' && ref.current) {
			// Direct DOM manipulation for web gradient
			const element = ref.current as unknown as HTMLElement
			// @ts-expect-error - will be fixed in next expo version
			const angle = Math.atan2(end?.y - start?.y, end?.x - start?.x)
			const degrees = (angle * 180) / Math.PI + 90
			const gradientString = `linear-gradient(${degrees}deg, ${colors.join(', ')})`

			// Apply gradient directly to DOM
			element.style.backgroundImage = gradientString
		}
		// @ts-expect-error - will be fixed in next expo version
	}, [colors, end?.x, end?.y, start?.x, start?.y])

	if (Platform.OS === 'web') {
		const flattenedStyle = StyleSheet.flatten(style)
		// oxlint-disable-next-line jsx-props-no-spreading
		return <View {...props} ref={ref} style={flattenedStyle} />
	}

	return (
		<ExpoLinearGradient
			colors={colors}
			end={end}
			start={start}
			style={style}
			// oxlint-disable-next-line jsx-props-no-spreading
			{...props}
		/>
	)
}
