import {
	StyleSheet,
	UnistylesRuntime,
	withUnistyles,
} from 'react-native-unistyles'

import { LinearGradient } from '@/components/LinearGradient'

const styles = StyleSheet.create({
	gradient: {
		height: UnistylesRuntime.insets.top,
		left: 0,
		position: 'absolute',
		right: 0,
		top: 0,
		width: '100%',
		zIndex: 99_999,
	},
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

export default function HeaderGradient() {
	if (UnistylesRuntime.insets.top === 0) {
		return null
	}

	return <UniLinearGradient style={styles.gradient} />
}
