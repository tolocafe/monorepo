import { useLingui } from '@lingui/react/macro'
import {
	NativeTabs,
	NativeTabsTriggerIcon,
	NativeTabsTriggerLabel,
} from 'expo-router/unstable-native-tabs'
import { Platform } from 'react-native'
import { useUnistyles } from 'react-native-unistyles'

import { FloatingOrderCard } from '@/components/FloatingOrderCard'
import { useIsBarista } from '@/lib/hooks/use-is-barista'
import { useCurrentOrder } from '@/lib/stores/order-store'

export const unstable_settings = {
	initialRouteName: '(home)',
}

export default function TabsLayout() {
	const { t } = useLingui()
	const { theme } = useUnistyles()
	const isBarista = useIsBarista()

	const currentOrder = useCurrentOrder()

	return (
		<>
			{currentOrder && Platform.OS !== 'ios' && (
				<FloatingOrderCard currentOrder={currentOrder} />
			)}
			<NativeTabs
				tintColor={theme.colors.verde.solid}
				minimizeBehavior={currentOrder ? 'onScrollDown' : 'automatic'}
				backgroundColor={theme.colors.gray.background}
				rippleColor={theme.colors.verde.border}
				indicatorColor={theme.colors.verde.border}
				labelVisibilityMode="labeled"
			>
				{currentOrder && (
					<NativeTabs.BottomAccessory>
						<FloatingOrderCard currentOrder={currentOrder} />
					</NativeTabs.BottomAccessory>
				)}
				<NativeTabs.Trigger name="(home)">
					<NativeTabsTriggerLabel>{t`Home`}</NativeTabsTriggerLabel>
					<NativeTabsTriggerIcon
						drawable="home"
						sf={{
							default: 'house',
							selected: 'house.fill',
						}}
					/>
				</NativeTabs.Trigger>
				{isBarista && (
					<NativeTabs.Trigger name="team">
						<NativeTabsTriggerLabel>{t`Team`}</NativeTabsTriggerLabel>
						<NativeTabsTriggerIcon
							drawable="user"
							sf={{
								default: 'person.3.sequence',
								selected: 'person.3.sequence.fill',
							}}
						/>
					</NativeTabs.Trigger>
				)}
				<NativeTabs.Trigger name="profile">
					<NativeTabsTriggerLabel>{t`Profile`}</NativeTabsTriggerLabel>
					<NativeTabsTriggerIcon
						drawable="user"
						sf={{
							default: 'person',
							selected: 'person.fill',
						}}
					/>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger role="more" name="more">
					<NativeTabsTriggerLabel>{t`More`}</NativeTabsTriggerLabel>
					<NativeTabsTriggerIcon drawable="photos" />
				</NativeTabs.Trigger>
			</NativeTabs>
		</>
	)
}
