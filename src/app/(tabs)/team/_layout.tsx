import { useLingui } from '@lingui/react/macro'
import { Stack } from 'expo-router'
import { useUnistyles } from 'react-native-unistyles'

import { defaultStackScreenOptions } from '@/lib/navigation'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function Layout() {
	const { t } = useLingui()
	const { theme } = useUnistyles()

	return (
		<Stack screenOptions={defaultStackScreenOptions(theme.colors.gray.text)}>
			<Stack.Screen
				name="index"
				options={{ headerShown: false, title: t`Team` }}
			/>
			<Stack.Screen
				name="queue"
				options={{ headerLargeTitle: false, title: t`Queue` }}
			/>
		</Stack>
	)
}
