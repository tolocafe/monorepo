import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { LinearGradient } from '~/components/LinearGradient'

const styles = StyleSheet.create({
	gradient: {
		...StyleSheet.absoluteFillObject,
		bottom: 'auto',
		height: 90,
		width: '100%',
		zIndex: 999_999,
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
	return <UniLinearGradient style={styles.gradient} />
}
