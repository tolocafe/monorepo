import { Stack } from 'expo-router'

import { defaultStackScreenOptions } from '@/lib/navigation'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function Layout() {
	return (
		<Stack screenOptions={defaultStackScreenOptions}>
			<Stack.Screen name="index" />
			<Stack.Screen name="queue" />
			<Stack.Screen name="ticket" />
			<Stack.Screen name="redeem" />
		</Stack>
	)
}
