/**
 * Utility functions for text input filtering and validation
 */

/**
 * Removes all non-digit characters from a string
 * @param value - The input string to filter
 * @returns String containing only digits (0-9)
 */
export function filterDigitsOnly(value: string): string {
	return value.replaceAll(/\D+/gu, '')
}

/**
 * Formats a numeric string with a maximum length
 * @param value - The input string to filter and limit
 * @param maxLength - Maximum number of digits allowed
 * @returns String containing only digits up to maxLength
 */
export function filterDigitsWithLimit(
	value: string,
	maxLength: number,
): string {
	if (maxLength <= 0) {
		return ''
	}
	return filterDigitsOnly(value).slice(0, maxLength)
}

/**
 * Checks if a string contains only digits
 * @param value - The string to check
 * @returns True if the string contains only digits, false otherwise
 */
export function isDigitsOnly(value: string): boolean {
	return /^\d*$/u.test(value)
}
