import { queryOptions } from '@tanstack/react-query'

import { api } from '~/lib/services/api-service'

/**
 * Query options for fetching a specific table's bill
 */
export const tableQueryOptions = (locationId: string, tableId: string) =>
	queryOptions({
		queryFn: () => api.tables.get(locationId, tableId),
		queryKey: ['tables', locationId, tableId] as const,
	})
