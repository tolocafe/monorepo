import { Platform } from 'react-native'

export const defaultStackScreenOptions = Platform.select({
	android: {
		headerTransparent: false,
	},
	default: {
		headerTransparent: true,
	},
	ios: {
		headerLargeTitle: false,
		headerTransparent: true,
	},
})
