/**
 * Format a date string to a localized short date format.
 * @param dateString - ISO date string or any parseable date string
 * @returns Formatted date string (e.g., "Dec 17, 2025") or empty string if invalid
 */
export function formatDate(dateString?: null | string): string {
	if (!dateString) return ''

	const date = new Date(dateString)

	if (Number.isNaN(date.getTime())) return ''

	return date.toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
}
