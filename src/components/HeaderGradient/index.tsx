import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useColorScheme } from '@/lib/hooks/use-color-scheme'

export default function HeaderGradient() {
	const { top } = useSafeAreaInsets()
	const isDark = useColorScheme() === 'dark'

	if (top === 0) {
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
			style={{
				height: top,
				left: 0,
				position: 'absolute',
				right: 0,
				top: 0,
				width: '100%',
				zIndex: 99_999,
			}}
		/>
	)
}
