import { Platform } from 'react-native'

import { StyleSheet, useUnistyles, withUnistyles } from 'react-native-unistyles'

import { LinearGradient } from '@/components/LinearGradient'

const styles = StyleSheet.create({
	gradient: (height: number | undefined) => ({
		...StyleSheet.absoluteFillObject,
		bottom: 'auto',
		height: height || Platform.select({ default: 50, web: 25 }),
		width: '100%',
		zIndex: 999_999,
	}),
})

const UniLinearGradient = withUnistyles(LinearGradient, (_theme, rt) => ({
	colors:
		rt.colorScheme === 'dark'
			? ([
					'rgba(18,18,18,0.95)',
					'rgba(18,18,18,0.8)',
					'rgba(18,18,18,0)',
				] as const)
			: ([
					'rgba(248,248,241,0.95)',
					'rgba(248,248,241,0.8)',
					'rgba(248,248,241,0)',
				] as const),
}))

export default function HeaderGradient({ height }: { height?: number }) {
	const unistyles = useUnistyles()

	if (Platform.OS !== 'web' && unistyles.rt.insets.top === 0 && !height) {
		return null
	}

	return <UniLinearGradient style={styles.gradient(height)} />
}
