// Ensure unistyles is configured before any usage
import '~/lib/styles/unistyles'
//
import { useLingui } from '@lingui/react/macro'
import {
	NativeTabs,
	NativeTabsTriggerIcon,
	NativeTabsTriggerLabel,
} from 'expo-router/unstable-native-tabs'
import { Platform } from 'react-native'
import { useUnistyles } from 'react-native-unistyles'

import { FloatingOrderCard } from '~/components/FloatingOrderCard'
import { useIsTeamMember } from '~/lib/hooks/use-is-barista'
import {
	useHasActiveOrder,
	useOrderProducts,
	useTransactionId,
} from '~/lib/stores/order-store'

export const unstable_settings = {
	initialRouteName: '(home)',
}

export default function TabsLayout() {
	const { t } = useLingui()
	const { theme } = useUnistyles()
	const isTeamMember = useIsTeamMember()

	const products = useOrderProducts()
	const transactionId = useTransactionId()
	const hasActiveOrder = useHasActiveOrder()

	return (
		<>
			{hasActiveOrder && Platform.OS !== 'ios' && (
				<FloatingOrderCard products={products} transactionId={transactionId} />
			)}
			<NativeTabs
				tintColor={theme.colors.verde.solid}
				minimizeBehavior={hasActiveOrder ? 'onScrollDown' : 'automatic'}
				backgroundColor={theme.colors.gray.background}
				rippleColor={theme.colors.verde.border}
				indicatorColor={theme.colors.verde.border}
				labelVisibilityMode="labeled"
			>
				{hasActiveOrder && (
					<NativeTabs.BottomAccessory>
						<FloatingOrderCard
							products={products}
							transactionId={transactionId}
						/>
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
				{isTeamMember && (
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
