import { useLingui } from '@lingui/react/macro'
import { Stack } from 'expo-router'
import { useUnistyles } from 'react-native-unistyles'

import { defaultStackScreenOptions } from '@/lib/navigation'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function AccountLayout() {
	const { t } = useLingui()
	const { theme } = useUnistyles()

	return (
		<Stack screenOptions={defaultStackScreenOptions(theme.colors.gray.text)}>
			<Stack.Screen
				name="index"
				options={{ headerShown: false, title: t`Account` }}
			/>
			<Stack.Screen name="orders" options={{ title: t`Orders` }} />
			<Stack.Screen name="profile" options={{ title: t`Profile` }} />
			<Stack.Screen name="sessions" options={{ title: t`Sessions` }} />
			<Stack.Screen name="top-up" options={{ title: t`Top Up` }} />
		</Stack>
	)
}
