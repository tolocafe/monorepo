import { Platform } from 'react-native'

export const defaultStackScreenOptions = (color?: string) =>
	Platform.select({
		ios: {
			headerLargeTitle: true,
			headerTintColor: color ?? 'black',
			headerTransparent: true,
		},
	})
