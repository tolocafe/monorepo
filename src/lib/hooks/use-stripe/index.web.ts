// Types
export type PaymentMethod = 'apple_pay' | 'card' | 'ewallet' | 'google_pay'

// Constants
export const PLATFORM_PAY_OPTIONS = {
	currencyCode: 'MXN',
	merchantCountryCode: 'MX',
} as const

/**
 * Returns the default payment method based on the platform and support
 */
export function getDefaultPaymentMethod(
	_isPlatformPaySupported: boolean,
): PaymentMethod {
	// On web, always default to card
	return 'card'
}

/** Apple Pay cart item configuration - stub for web */
export function createApplePayConfig(amount: number, label: string) {
	return {
		applePay: {
			cartItems: [
				{
					amount: (amount / 100).toString(),
					label,
					paymentType: 'Immediate',
				},
			],
			...PLATFORM_PAY_OPTIONS,
		},
	}
}

/** Google Pay configuration - stub for web */
export function createGooglePayConfig(
	amount: number,
	label: string,
	testEnv = false,
) {
	return {
		googlePay: {
			amount,
			label,
			testEnv,
			...PLATFORM_PAY_OPTIONS,
		},
	}
}

/**
 * Hook to check if platform pay is supported - always false on web
 */
export function usePlatformPaySupport() {
	return {
		isChecking: false,
		isPlatformPaySupported: false,
	}
}

// Stub implementations for web - to be implemented with @stripe/stripe-js
export const PaymentSheetError = {
	Canceled: 'Canceled',
	Failed: 'Failed',
	Timeout: 'Timeout',
}

export const PlatformPay = {
	ButtonStyle: {
		Automatic: 'automatic',
		Black: 'black',
		White: 'white',
		WhiteOutline: 'whiteOutline',
	},
	ButtonType: {
		Add: 'addMoney',
		Book: 'book',
		Buy: 'buy',
		Checkout: 'checkout',
		Continue: 'continue',
		Donate: 'donate',
		Order: 'order',
		Pay: 'pay',
		Plain: 'plain',
		Reload: 'reload',
		Rent: 'rent',
		SetUp: 'setUp',
		Subscribe: 'subscribe',
		Tip: 'tip',
		TopUp: 'topUp',
	},
	PaymentType: {
		Deferred: 'Deferred',
		Immediate: 'Immediate',
		Recurring: 'Recurring',
	},
}

/** Web stub for PlatformPayButton - renders nothing */
export function PlatformPayButton() {
	return null
}

export function initStripe() {
	console.warn('initStripe should use @stripe/stripe-js on web')
	return Promise.resolve()
}

export function confirmPlatformPayPayment() {
	console.warn('confirmPlatformPayPayment is not implemented for web')
	return Promise.resolve({ error: { message: 'Not implemented for web' } })
}

export function initPaymentSheet() {
	console.warn('initPaymentSheet is not implemented for web')
	return Promise.resolve({ error: { message: 'Not implemented for web' } })
}

export function presentPaymentSheet() {
	console.warn('presentPaymentSheet is not implemented for web')
	return Promise.resolve({ error: { message: 'Not implemented for web' } })
}

/**
 * Web stub for useStripe hook
 * To be implemented with @stripe/stripe-js for web support
 */
export function useStripe() {
	return {
		confirmPayment: () => Promise.resolve({ error: null }),
		createPaymentMethod: () => Promise.resolve({ error: null }),
		createToken: () => Promise.resolve({ error: null }),
		handleNextAction: () => Promise.resolve({ error: null }),
		initPaymentSheet: () => Promise.resolve({ error: null }),
		isCheckingPlatformPay: false,
		isPlatformPaySupported: false,
		presentPaymentSheet: () => Promise.resolve({ error: null }),
		retrievePaymentIntent: () => Promise.resolve({ error: null }),
		retrieveSetupIntent: () => Promise.resolve({ error: null }),
	}
}
