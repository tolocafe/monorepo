// Ensure unistyles is configured before any usage
import '@/lib/styles/unistyles'
//
import { useLingui } from '@lingui/react/macro'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { Platform } from 'react-native'
import { useUnistyles } from 'react-native-unistyles'

import { FloatingOrderCard } from '@/components/FloatingOrderCard'
import { useIsTeamMember } from '@/lib/hooks/use-is-barista'
import {
	useHasActiveOrder,
	useOrderProducts,
	useTransactionId,
} from '@/lib/stores/order-store'

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
				key={String(isTeamMember)}
				tintColor={theme.colors.primary.solid}
				minimizeBehavior={hasActiveOrder ? 'onScrollDown' : 'automatic'}
				backgroundColor={theme.colors.gray.background}
				rippleColor={theme.colors.primary.border}
				indicatorColor={theme.colors.primary.border}
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
					<NativeTabs.Trigger.Label>{t`Home`}</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						drawable="home"
						sf={{
							default: 'house',
							selected: 'house.fill',
						}}
					/>
				</NativeTabs.Trigger>
				{isTeamMember && (
					<NativeTabs.Trigger name="team">
						<NativeTabs.Trigger.Label>{t`Team`}</NativeTabs.Trigger.Label>
						<NativeTabs.Trigger.Icon
							drawable="user"
							sf={{
								default: 'person.3.sequence',
								selected: 'person.3.sequence.fill',
							}}
						/>
					</NativeTabs.Trigger>
				)}
				<NativeTabs.Trigger name="profile">
					<NativeTabs.Trigger.Label>{t`Profile`}</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						drawable="user"
						sf={{
							default: 'person',
							selected: 'person.fill',
						}}
					/>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger role="more" name="more">
					<NativeTabs.Trigger.Label>{t`More`}</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon drawable="photos" />
				</NativeTabs.Trigger>
			</NativeTabs>
		</>
	)
}
