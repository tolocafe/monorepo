const formatter = new Intl.NumberFormat('en-US', {
	currency: 'USD',
	maximumFractionDigits: 2,
	minimumFractionDigits: 0,
	style: 'currency',
})

/**
 * Formats Poster product prices which are returned as strings/numbers in cents.
 * Remove cents if they are 00.
 * Example: "250" (cents) -> "$2.50", "300" -> "$3"
 */
export function formatPrice(value: number | string): string {
	const cents = typeof value === 'string' ? Number.parseFloat(value) : value
	if (!Number.isFinite(cents)) return '$0'

	const dollars = cents / 100

	return formatter.format(dollars)
}
