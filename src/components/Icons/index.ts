import Ionicons from '@expo/vector-icons/Ionicons'
import { Platform } from 'react-native'
import { withUnistyles } from 'react-native-unistyles'

export const TextColorIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.text,
}))

export const GrayColorIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.solid,
}))

export const HeaderIconIonicons = withUnistyles(Ionicons, (theme) => ({
	color: Platform.OS === 'android' ? 'white' : theme.colors.gray.text,
}))

export const RedColorIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.rojo.solid,
}))

export const GreenColorIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.verde.solid,
}))
