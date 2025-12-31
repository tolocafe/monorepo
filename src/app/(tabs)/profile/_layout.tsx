import { useLingui } from '@lingui/react/macro'
import { Stack } from 'expo-router'
import { useUnistyles } from 'react-native-unistyles'

import { defaultStackScreenOptions } from '@/lib/navigation'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function ProfileLayout() {
	const { t } = useLingui()
	const { theme } = useUnistyles()

	return (
		<Stack screenOptions={defaultStackScreenOptions(theme.colors.gray.text)}>
			<Stack.Screen
				name="index"
				options={{ headerShown: false, title: t`Profile` }}
			/>
			<Stack.Screen name="edit" options={{ title: t`Edit Profile` }} />
			<Stack.Screen name="sessions" options={{ title: t`Sessions` }} />
			<Stack.Screen name="orders/index" options={{ title: t`Orders` }} />
			<Stack.Screen
				name="orders/current"
				options={{ title: t`Current Order` }}
			/>
			<Stack.Screen name="orders/[id]" options={{ title: t`Order Detail` }} />
		</Stack>
	)
}
