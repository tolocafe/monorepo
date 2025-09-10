import type { ComponentProps } from 'react'

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
	return <UniWalletView {...props} />
}
