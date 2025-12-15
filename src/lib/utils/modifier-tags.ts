export type ModifierTagColors = { bg: string; text: string }
export type ModifierTagIcon = null | { color: string; name: 'flame' | 'snow' }

// Modifier colors by name (specific modifiers)
const MODIFIER_NAME_COLORS = {
	// Milk types
	Avena: { bg: '#EFEBE9', text: '#6D4C41' }, // Brown for oat
	// Temperature - hot (red)
	Caliente: { bg: '#FFEBEE', text: '#D32F2F' },
	// Matcha grades (green)
	Ceremonial: { bg: '#E8F5E9', text: '#388E3C' },

	Deslactosada: { bg: '#FCE4EC', text: '#C2185B' }, // Pink for lactose-free
	Doble: { bg: '#E1BEE7', text: '#6A1B9A' },
	Entera: { bg: '#E3F2FD', text: '#1565C0' }, // Blue for whole milk

	'Extra Caliente': { bg: '#FFCDD2', text: '#C62828' },
	// Temperature - cold (blue)
	Frío: { bg: '#E3F2FD', text: '#1976D2' },

	Imperial: { bg: '#C8E6C9', text: '#2E7D32' },
	// Neutral
	Natural: { bg: '#FAFAFA', text: '#616161' },

	// Extras (purple)
	'Una adicional': { bg: '#F3E5F5', text: '#7B1FA2' },
} satisfies Record<string, ModifierTagColors>

// Modifier colors by group/category (fallback)
const MODIFIER_GROUP_COLORS = {
	'Caliente/Frío': { bg: '#FFF3E0', text: '#E65100' }, // Orange for temp
	'Dosis Extra': { bg: '#F3E5F5', text: '#7B1FA2' }, // Purple for extras
	Leche: { bg: '#E3F2FD', text: '#1565C0' }, // Blue for milk
	Matcha: { bg: '#E8F5E9', text: '#388E3C' }, // Green for matcha
	Option: { bg: '#F5F5F5', text: '#757575' }, // Gray for generic
	Other: { bg: '#F5F5F5', text: '#757575' }, // Gray fallback
	Temperatura: { bg: '#FFF3E0', text: '#E65100' }, // Orange for temp
} satisfies Record<string, ModifierTagColors>

// Priority order for modifier groups (lower = first)
// 1. Temperature, 2. Milk type, 3. Coffee/Matcha type, 4. Extras, 5. Other
const MODIFIER_GROUP_PRIORITY: Record<string, number> = {
	Café: 3,
	'Caliente/Frío': 1,
	'Dosis Extra': 4,
	Leche: 2,
	Matcha: 3,
	Option: 5,
	Other: 6,
	Temperatura: 1,
}

// Modifier name priorities for more precise sorting within groups
const MODIFIER_NAME_PRIORITY: Record<string, number> = {
	Avena: 2,
	// Temperature (1)
	Caliente: 1,
	Ceremonial: 3,
	Deslactosada: 2,
	Doble: 4,
	// Milk types (2)
	Entera: 2,
	'Extra Caliente': 1,
	Frío: 1,
	// Coffee/Matcha types (3)
	Imperial: 3,
	Internacional: 3,
	Natural: 3,
	// Extras (4)
	'Una adicional': 4,
}

// Temperature-related modifier names
const HOT_MODIFIERS = new Set(['Caliente', 'Extra Caliente'])
const COLD_MODIFIERS = new Set(['Frío'])

/**
 * Get color for a modifier based on name first, then group.
 */
export function getModifierColor(
	name: string,
	group?: string,
): ModifierTagColors {
	// First check by specific name
	if (name in MODIFIER_NAME_COLORS) {
		return MODIFIER_NAME_COLORS[name as keyof typeof MODIFIER_NAME_COLORS]
	}
	// Then by group
	if (group && group in MODIFIER_GROUP_COLORS) {
		return MODIFIER_GROUP_COLORS[group as keyof typeof MODIFIER_GROUP_COLORS]
	}
	// Default gray
	return MODIFIER_GROUP_COLORS.Other
}

/**
 * Get icon for a modifier (currently only temperature)
 */
export function getModifierIcon(name: string): ModifierTagIcon {
	if (HOT_MODIFIERS.has(name)) {
		return { color: '#D32F2F', name: 'flame' }
	}
	if (COLD_MODIFIERS.has(name)) {
		return { color: '#1976D2', name: 'snow' }
	}
	return null
}

/**
 * Sort modifiers by priority: temperature → milk → coffee/matcha type → extras → other.
 */
export function sortModifiers<T extends { group: string; name: string }>(
	modifiers: T[],
): T[] {
	// eslint-disable-next-line unicorn/no-array-sort
	return [...modifiers].sort((a, b) => {
		// First try by specific modifier name
		const namePriorityA = MODIFIER_NAME_PRIORITY[a.name] ?? 99
		const namePriorityB = MODIFIER_NAME_PRIORITY[b.name] ?? 99
		if (namePriorityA !== namePriorityB) {
			return namePriorityA - namePriorityB
		}
		// Fall back to group priority
		const priorityA = MODIFIER_GROUP_PRIORITY[a.group] ?? 99
		const priorityB = MODIFIER_GROUP_PRIORITY[b.group] ?? 99
		return priorityA - priorityB
	})
}
