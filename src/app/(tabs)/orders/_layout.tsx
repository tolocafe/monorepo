import { useLingui } from '@lingui/react/macro'
import { Stack } from 'expo-router'
import { useUnistyles } from 'react-native-unistyles'

import { defaultStackScreenOptions } from '@/lib/navigation'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function OrdersLayout() {
	const { t } = useLingui()
	const { theme } = useUnistyles()

	return (
		<Stack screenOptions={defaultStackScreenOptions(theme.colors.text)}>
			<Stack.Screen
				name="index"
				options={{ headerShown: false, title: t`Orders` }}
			/>
			<Stack.Screen name="current" options={{ title: t`Current Order` }} />
			<Stack.Screen name="[id]" options={{ title: t`Order Detail` }} />
		</Stack>
	)
}
