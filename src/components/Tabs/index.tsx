import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation'
import type {
	NativeBottomTabNavigationEventMap,
	NativeBottomTabNavigationOptions,
} from '@bottom-tabs/react-navigation'
import type {
	ParamListBase,
	TabNavigationState,
} from '@react-navigation/native'
import { withLayoutContext } from 'expo-router'

const BottomTabNavigator = createNativeBottomTabNavigator().Navigator

const Tabs = withLayoutContext<
	NativeBottomTabNavigationOptions,
	typeof BottomTabNavigator,
	TabNavigationState<ParamListBase>,
	NativeBottomTabNavigationEventMap
>(BottomTabNavigator)

export { useBottomTabBarHeight } from 'react-native-bottom-tabs'

export default Tabs
