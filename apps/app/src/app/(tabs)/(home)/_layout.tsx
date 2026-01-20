import { Stack } from 'expo-router'

import { defaultStackScreenOptions } from '@/lib/navigation'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function HomeLayout() {
	return <Stack screenOptions={defaultStackScreenOptions} />
}
