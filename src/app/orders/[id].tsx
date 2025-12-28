import Head from 'expo-router/head'
import { useLocalSearchParams } from 'expo-router'
import { useLingui } from '@lingui/react/macro'

import ClosedOrderDetail from '@/containers/closed-order-detail'
import OngoingOrderDetail from '@/containers/ongoing-order-detail'
import { useCurrentOrder } from '@/lib/stores/order-store'

export default function OrderDetailScreen() {
	const { t } = useLingui()
	const { id } = useLocalSearchParams<{ id: string }>()
	const currentOrder = useCurrentOrder()

	const isCurrentOrder = id === 'current'
	const hasCurrentOrder = Boolean(currentOrder)

	return (
		<>
			<Head>
				<title>
					{isCurrentOrder ? t`Current Order` : t`Order #${id}`} - TOLO
				</title>
			</Head>
			{isCurrentOrder && hasCurrentOrder ? (
				<OngoingOrderDetail />
			) : (
				<ClosedOrderDetail orderId={id} />
			)}
		</>
	)
}
