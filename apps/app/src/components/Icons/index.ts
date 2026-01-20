import Ionicons from '@expo/vector-icons/Ionicons'
import { withUnistyles } from 'react-native-unistyles'

export const TextColorIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.text,
}))

export const GrayColorIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.solid,
}))

export const HeaderIconIonicons = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.text,
}))

export const RedColorIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.error.solid,
}))

export const GreenColorIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.primary.solid,
}))
