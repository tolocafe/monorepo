/**
 * Factory function to create API-specific error classes
 */
export function createApiError(name: string) {
	return class ApiError extends Error {
		constructor(message: string) {
			super(message)
			this.name = name
		}
	}
}

export const PosterError = createApiError('PosterError')
export const ShopifyError = createApiError('ShopifyError')
