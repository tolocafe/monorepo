import type { Stack } from 'expo-router'
import { Platform } from 'react-native'

import { isIOS20 } from '@/lib/constants/ui'

export const defaultStackScreenOptions = Platform.select({
	android: {
		headerTransparent: false,
	} satisfies Parameters<typeof Stack.Screen>[0]['options'],
	default: {
		headerTransparent: true,
	} satisfies Parameters<typeof Stack.Screen>[0]['options'],
	ios: {
		headerLargeTitle: false,
		headerTransparent: isIOS20,
	} satisfies Parameters<typeof Stack.Screen>[0]['options'],
})
