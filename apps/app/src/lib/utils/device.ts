import { Platform } from 'react-native'

export const canUseDOM =
	// eslint-disable-next-line unicorn/prefer-global-this, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-deprecated
	typeof window !== 'undefined' && window.document?.createElement !== null

export const isDevice = Platform.OS === 'ios' || Platform.OS === 'android'

export const isWeb = Platform.OS === 'web'
