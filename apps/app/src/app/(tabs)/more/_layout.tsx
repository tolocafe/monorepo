import { Stack } from 'expo-router'

import { defaultStackScreenOptions } from '~/lib/navigation'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function MoreLayout() {
	return (
		<Stack screenOptions={defaultStackScreenOptions}>
			<Stack.Screen name="index" />
			<Stack.Screen name="app" />
			<Stack.Screen name="visit-us" />
		</Stack>
	)
}
