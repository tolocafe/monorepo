import { Platform } from 'react-native'

export const defaultStackScreenOptions = (color?: string) =>
	Platform.select({
		default: {
			headerTransparent: true,
		},
		ios: {
			headerLargeTitle: false,
			headerTintColor: color ?? 'black',
			headerTransparent: true,
		},
	})
