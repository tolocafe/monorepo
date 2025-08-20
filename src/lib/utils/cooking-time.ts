/**
 * Formats cooking time from seconds to human-readable format.
 * Returns appropriate units based on the duration:
 * - Less than 60 seconds: "X sec"
 * - 1-59 minutes: "X min"
 * - 1+ hours: "X hr Y min" (omits minutes if 0)
 */
export function formatCookingTime(seconds: number | string): string {
	const totalSeconds =
		typeof seconds === 'string'
			? Number.parseInt(seconds, 10)
			: Math.floor(seconds)

	// Handle invalid input
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
		return ''
	}

	// Less than 60 seconds - show in seconds
	if (totalSeconds < 60) {
		return `${totalSeconds} sec`
	}

	const totalMinutes = Math.floor(totalSeconds / 60)

	// Less than 60 minutes - show in minutes
	if (totalMinutes < 60) {
		return `${totalMinutes} min`
	}

	// 60+ minutes - show in hours and minutes
	const hours = Math.floor(totalMinutes / 60)
	const remainingMinutes = totalMinutes % 60

	if (remainingMinutes === 0) {
		return `${hours} hr`
	}

	return `${hours} hr ${remainingMinutes} min`
}
