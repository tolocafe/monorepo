import { useLingui } from '@lingui/react/macro'
import { Stack } from 'expo-router'
import { useUnistyles } from 'react-native-unistyles'

import { defaultStackScreenOptions } from '@/lib/navigation'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function MoreLayout() {
	const { t } = useLingui()
	const { theme } = useUnistyles()

	return (
		<Stack screenOptions={defaultStackScreenOptions(theme.colors.text)}>
			<Stack.Screen
				name="index"
				options={{ headerShown: false, title: t`More` }}
			/>
			<Stack.Screen name="app" options={{ title: t`App` }} />
			<Stack.Screen name="visit-us" options={{ title: t`Visit Us` }} />
			<Stack.Screen name="profile" options={{ title: t`Profile` }} />
			<Stack.Screen name="top-up" options={{ title: t`Top Up` }} />
		</Stack>
	)
}
