import { Platform } from 'react-native'

export const isStaticWeb =
	// eslint-disable-next-line unicorn/no-typeof-undefined
	typeof globalThis.window === 'undefined' && Platform.OS === 'web'
