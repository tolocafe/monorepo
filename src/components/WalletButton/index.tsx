import type { ComponentProps } from 'react'
import { Platform } from 'react-native'

import {
	addPassWithSignedJwt,
	addPass as rnWalletAddPass,
	RNWalletView,
} from '@premieroctet/react-native-wallet'
import { withUnistyles } from 'react-native-unistyles'

type Props = ComponentProps<typeof RNWalletView>

export function addPass(urlOrJwt: string, isSigned: boolean) {
	if (isSigned) {
		return addPassWithSignedJwt(urlOrJwt)
	}
	return rnWalletAddPass(urlOrJwt)
}

const UniWalletView = withUnistyles(RNWalletView)

export default function WalletButton(props: Props) {
	if (Platform.OS === 'macos') return null

	return <UniWalletView {...props} />
}
