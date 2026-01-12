import { Platform } from 'react-native'

/**
 * UI component dimensions and layout constants
 */
export const ORDER_BUTTON_HEIGHT = Platform.select({
	android: 60,
	default: 55,
	web: 80,
})
