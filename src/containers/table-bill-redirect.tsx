import { useEffect } from 'react'

import { Redirect, useLocalSearchParams } from 'expo-router'

/**
 * Legacy redirect from /tables/[table_id] to /tables/1/[table_id]
 * Assumes location_id = 1 for backwards compatibility
 */
export default function TableBillRedirect() {
	const { table_id } = useLocalSearchParams<{ table_id: string }>()

	useEffect(() => {
		// eslint-disable-next-line no-console
		console.warn(
			`[Deprecated] /tables/${table_id} route is deprecated. Use /tables/[location_id]/[table_id] instead`,
		)
	}, [table_id])

	return <Redirect href={`/tables/1/${table_id}`} />
}

