/**
 * Formats a phone number for display
 * @param phone - Raw phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
	// Remove all non-digit characters
	const digits = phone.replaceAll(/\D/g, '')

	// Handle different phone number lengths
	if (digits.length === 10) {
		// US format: (123) 456-7890
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
	}

	if (digits.length === 11 && digits.startsWith('1')) {
		// US format with country code: +1 (123) 456-7890
		return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
	}

	if (digits.length === 12 && digits.startsWith('52')) {
		const nationalNumber = digits.slice(2)
		if (nationalNumber.startsWith('55')) {
			return `(${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 6)} ${nationalNumber.slice(6)}`
		}

		return `(${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`
	}

	// For other formats, just return the original
	return phone
}

/**
 * Validates if a phone number is in a valid format
 * @param phone - Phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
	const digits = phone.replaceAll(/\D/g, '')

	// Accept 10 digits or 11 digits starting with 1
	return (
		digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
	)
}

/**
 * Normalizes phone number to digits only
 * @param phone - Phone number to normalize
 * @returns Digits-only phone number
 */
export function normalizePhoneNumber(phone: string): string {
	return phone.replaceAll(/\D/g, '')
}
