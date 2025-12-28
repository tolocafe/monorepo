import { useLingui } from '@lingui/react/macro'
import { Stack } from 'expo-router'
import { useUnistyles } from 'react-native-unistyles'

import { defaultStackScreenOptions } from '@/lib/navigation'

export default function OrdersLayout() {
	const { t } = useLingui()
	const { theme } = useUnistyles()

	return (
		<Stack screenOptions={defaultStackScreenOptions(theme.colors.gray.text)}>
			<Stack.Screen
				name="[id]"
				options={{
					headerTintColor: 'white',
					headerTransparent: true,
					presentation: 'modal',
					title: t`Order`,
				}}
			/>
		</Stack>
	)
}
