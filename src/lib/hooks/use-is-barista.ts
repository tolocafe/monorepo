import { useQuery } from '@tanstack/react-query'

import { selfQueryOptions } from '@/lib/queries/auth'

const BARISTA_GROUP_IDS = new Set(['8', '9']) // 8 = owners, 9 = members

/**
 * Hook to check if the current user is a barista (staff member)
 * @returns isBarista - Whether the user is in a barista group
 */
export function useIsBarista(options?: Partial<typeof selfQueryOptions>) {
	const { data: user } = useQuery({ ...selfQueryOptions, ...options })

	return Boolean(
		user?.client_groups_id && BARISTA_GROUP_IDS.has(user.client_groups_id),
	)
}
