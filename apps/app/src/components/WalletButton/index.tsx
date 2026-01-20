import {
	addPassWithSignedJwt,
	addPass as rnWalletAddPass,
	RNWalletView,
} from '@premieroctet/react-native-wallet'
import type { ComponentProps } from 'react'
import { Platform } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

type Props = ComponentProps<typeof RNWalletView> & { disabled?: boolean }

export function addPass(urlOrJwt: string, isSigned: boolean) {
	if (isSigned) {
		return addPassWithSignedJwt(urlOrJwt)
	}
	return rnWalletAddPass(urlOrJwt)
}

const UniWalletView = withUnistyles(RNWalletView)

const styles = StyleSheet.create({
	button: {
		opacity: 1,
		variants: {
			disabled: {
				true: {
					opacity: 0.5,
					touchAction: 'none',
				},
			},
		},
	},
})

export default function WalletButton({ disabled, style, ...props }: Props) {
	styles.useVariants({ disabled })

	if (Platform.OS === 'macos') return null

	// oxlint-disable-next-line jsx-props-no-spreading
	return <UniWalletView {...props} style={[style, styles.button]} />
}
