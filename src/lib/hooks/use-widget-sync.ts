import { useEffect } from 'react'
import { Platform } from 'react-native'

import { useQuery } from '@tanstack/react-query'

import { selfQueryOptions } from '@/lib/queries/auth'
import { transactionsQueryOptions } from '@/lib/queries/transactions'
import SharedStorage from '~/modules/expo-shared-storage'

/**
 * Syncs user data to shared UserDefaults for widget consumption
 * Only runs on iOS
 */
export function useWidgetSync() {
	const { data: user } = useQuery(selfQueryOptions)
	const { data: transactions } = useQuery(transactionsQueryOptions)

	useEffect(() => {
		if (Platform.OS !== 'ios' || !user) {
			return
		}

		const currencyFormatter = new Intl.NumberFormat('es-MX', {
			currency: 'MXN',
			minimumFractionDigits: 0,
			style: 'currency',
		})

		const balance = currencyFormatter.format(
			Number.parseFloat(user.ewallet ?? '0') / 100,
		)

		const name = user.name || `${user.firstname} ${user.lastname}`.trim()
		const points = transactions?.length ?? 0

		// Sync data to widget
		SharedStorage.setString('userBalance', balance)
		SharedStorage.setString('userName', name)
		SharedStorage.setNumber('userPoints', points)
	}, [user, transactions])
}
