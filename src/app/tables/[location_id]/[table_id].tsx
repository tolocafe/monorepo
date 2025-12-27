import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { StyleSheet } from 'react-native-unistyles'

import ScreenContainer from '@/components/ScreenContainer'
import { trackEvent } from '@/lib/analytics'
import { selfQueryOptions } from '@/lib/queries/auth'
import { tableQueryOptions } from '@/lib/queries/tables'
import { useSetTableContext } from '@/lib/stores/order-store'

/**
 * Table QR Code landing - minimal redirect screen
 * - If active order exists: redirects to order detail
 * - If no order + logged in: sets table context and redirects to menu
 * - If no order + not logged in: redirects to sign-in
 */
export default function TableRedirect() {
	const { location_id, table_id } = useLocalSearchParams<{
		location_id: string
		table_id: string
	}>()
	const setTableContext = useSetTableContext()

	const { data: user, isLoading: isUserLoading } = useQuery({
		...selfQueryOptions,
		retry: false,
	})

	const { data: tableStatus, isLoading: isTableLoading } = useQuery({
		...tableQueryOptions(location_id, table_id),
		enabled: Boolean(table_id),
	})

	const isLoading = isUserLoading || isTableLoading

	useEffect(() => {
		if (isLoading) return

		// Active order exists - go to order detail
		if (tableStatus?.transactionId) {
			void trackEvent('table:bill_view', { table_id })
			router.replace(`/orders/${tableStatus.transactionId}`)
			return
		}

		// No order - if logged in, set context and go to menu
		if (user) {
			setTableContext({ locationId: location_id, tableId: table_id })
			void trackEvent('table:order_start', { table_id })
			router.replace('/')
			return
		}

		// No order and not logged in - go to sign-in
		router.replace('/sign-in')
	}, [isLoading, tableStatus, user, location_id, table_id, setTableContext])

	return (
		<ScreenContainer>
			<View style={styles.container}>
				<ActivityIndicator size="large" />
			</View>
		</ScreenContainer>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
})
