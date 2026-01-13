import { useQuery } from '@tanstack/react-query'

import { selfQueryOptions } from '@/lib/queries/auth'

const BARISTA_GROUP_ID = '9'
const OWNER_GROUP_ID = '8'

const TEAM_GROUP_IDS = new Set([OWNER_GROUP_ID, BARISTA_GROUP_ID]) // 8 = owners, 9 = members

/**
 * Hook to check if the current user is a barista (staff member)
 * @returns isBarista - Whether the user is in a barista group
 */
export function useIsBarista(options?: Partial<typeof selfQueryOptions>) {
	const { data: user } = useQuery({ ...selfQueryOptions, ...options })

	return Boolean(
		user?.client_groups_id && user.client_groups_id === BARISTA_GROUP_ID,
	)
}

export function useIsTeamMember(options?: Partial<typeof selfQueryOptions>) {
	const { data: user } = useQuery({ ...selfQueryOptions, ...options })

	return Boolean(
		user?.client_groups_id && TEAM_GROUP_IDS.has(user.client_groups_id),
	)
}
