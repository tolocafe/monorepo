import type { ComponentProps } from 'react'
import { Platform } from 'react-native'

import {
	addPass as RNAddPass,
	RNWalletView,
} from '@premieroctet/react-native-wallet'
import { withUnistyles } from 'react-native-unistyles'

type Props = ComponentProps<typeof RNWalletView>

export function addPass(url: string) {
	return RNAddPass(url)
}

const UniWalletView = withUnistyles(RNWalletView)

export default function WalletButton(props: Props) {
	if (Platform.OS === 'macos') {
		return null
	}

	return <UniWalletView {...props} />
}
