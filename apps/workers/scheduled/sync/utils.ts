/**
 * Utility functions for transaction syncing
 */

/**
 * Format a Date object to API date format (YYYY-MM-DD)
 */
export function formatApiDate(date: Date): string {
	return date.toISOString().replace(/T.*/, '')
}

/**
 * Parse Poster API date string to Date object
 * Input format: "Y-m-d H:i:s" (e.g., "2023-12-25 14:30:00")
 */
export function parsePosterDate(dateString: string): Date {
	// Convert "Y-m-d H:i:s" to "Y-m-dTH:i:sZ" format
	const isoString = dateString.replace(' ', 'T') + 'Z'
	const date = new Date(isoString)

	// Validate the parsed date
	if (Number.isNaN(date.getTime())) {
		throw new TypeError(`Invalid date format: ${dateString}`)
	}

	return date
}

/**
 * Convert a monetary value to cents (integer)
 */
export function toCents(value: number | string): number {
	const number_ =
		typeof value === 'number'
			? value
			: Number.parseFloat(value.replace(',', '.'))
	if (!Number.isFinite(number_)) return 0
	return Math.round(number_ * 100)
}

/**
 * Convert Poster date format to ISO string
 * Poster returns either:
 * 1. Unix timestamp in milliseconds as string (e.g., "1766004553569")
 * 2. "Y-m-d H:i:s" format (e.g., "2023-12-25 14:30:00")
 */
export function toISO(dateString: string): null | string {
	if (!dateString.trim()) return null

	// Try parsing as Unix timestamp first
	const timestamp = Number.parseInt(dateString, 10)
	if (
		!Number.isNaN(timestamp) &&
		timestamp > 0 && // If it's a reasonable timestamp (after 2000-01-01 and before 2100-01-01)
		timestamp > 946_684_800_000 &&
		timestamp < 4_102_444_800_000
	) {
		return new Date(timestamp).toISOString()
	}

	// Fall back to "Y-m-d H:i:s" format parsing
	const parsed = new Date(dateString.replace(' ', 'T') + 'Z')
	if (Number.isNaN(parsed.getTime())) return null
	return parsed.toISOString()
}
