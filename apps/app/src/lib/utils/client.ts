/**
 * Get full name from firstname and lastname
 */
export function getFullName(
	firstname: string | undefined,
	lastname: string | undefined,
) {
	const first = firstname ?? ''
	const last = lastname ? ` ${lastname}` : ''
	return `${first}${last}`.trim()
}

/**
 * Get client group key from Spanish group name
 */
export function getGroupName(groupName: string | undefined) {
	if (!groupName) return undefined
	if (/^clientes?$/i.test(groupName)) return 'CUSTOMER' as const
	if (/^amigos y familiares$/i.test(groupName))
		return 'FRIEND_AND_FAMILY' as const
	if (/^súper clientes?$/i.test(groupName)) return 'SUPER_CUSTOMER' as const
	if (/^vecinos?$/i.test(groupName)) return 'NEIGHBOR' as const
}
