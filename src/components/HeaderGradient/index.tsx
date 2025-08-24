import { LinearGradient } from 'expo-linear-gradient'
import { UnistylesRuntime } from 'react-native-unistyles'

import { useColorScheme } from '@/lib/hooks/use-color-scheme'

const linearGradientStyle = {
	height: UnistylesRuntime.insets.top,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	width: '100%',
	zIndex: 99_999,
} as const

export default function HeaderGradient() {
	const isDark = useColorScheme() === 'dark'

	if (UnistylesRuntime.insets.top === 0) {
		return null
	}

	return (
		<LinearGradient
			colors={
				isDark
					? ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']
					: [
							'rgba(255,255,255,0.9)',
							'rgba(255,255,255,0.7)',
							'rgba(255,255,255,0)',
						]
			}
			style={linearGradientStyle}
		/>
	)
}
