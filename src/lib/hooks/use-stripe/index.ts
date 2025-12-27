import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

import {
	confirmPlatformPayPayment,
	initPaymentSheet,
	initStripe,
	isPlatformPaySupported as getIsPlatformPaySupported,
	PaymentSheetError,
	PlatformPay,
	PlatformPayButton,
	presentPaymentSheet,
	useStripe as useStripeNative,
} from '@stripe/stripe-react-native'

// Types
export type PaymentMethod = 'apple_pay' | 'card' | 'ewallet' | 'google_pay'

// Re-export native Stripe components and functions
export {
	confirmPlatformPayPayment,
	initPaymentSheet,
	initStripe,
	PaymentSheetError,
	PlatformPay,
	PlatformPayButton,
	presentPaymentSheet,
}

// Constants
export const PLATFORM_PAY_OPTIONS = {
	currencyCode: 'MXN',
	merchantCountryCode: 'MX',
} as const

/**
 * Returns the default payment method based on the platform and support
 */
export function getDefaultPaymentMethod(
	isPlatformPaySupported: boolean,
): PaymentMethod {
	if (!isPlatformPaySupported) return 'card'
	if (Platform.OS === 'ios') return 'apple_pay'
	if (Platform.OS === 'android') return 'google_pay'
	return 'card'
}

/** Apple Pay cart item configuration */
export function createApplePayConfig(amount: number, label: string) {
	return {
		applePay: {
			cartItems: [
				{
					amount: (amount / 100).toString(),
					label,
					paymentType: PlatformPay.PaymentType.Immediate,
				},
			],
			...PLATFORM_PAY_OPTIONS,
		},
	} satisfies PlatformPay.ConfirmParams
}

/** Google Pay configuration */
export function createGooglePayConfig(
	amount: number,
	label: string,
	testEnv = __DEV__,
) {
	return {
		googlePay: {
			amount,
			label,
			testEnv,
			...PLATFORM_PAY_OPTIONS,
		},
	} satisfies PlatformPay.ConfirmParams
}

/**
 * Hook to check if platform pay (Apple Pay / Google Pay) is supported
 */
export function usePlatformPaySupport() {
	const [isPlatformPaySupported, setIsPlatformPaySupported] = useState(false)
	const [isChecking, setIsChecking] = useState(true)

	useEffect(() => {
		void getIsPlatformPaySupported()
			.then(setIsPlatformPaySupported)
			.finally(() => setIsChecking(false))
	}, [])

	return {
		isChecking,
		isPlatformPaySupported,
	}
}

/**
 * Custom wrapper around Stripe's useStripe hook
 * Provides a unified interface for native (iOS/Android) Stripe operations
 */
export function useStripe() {
	const stripeNative = useStripeNative()
	const { isPlatformPaySupported, isChecking } = usePlatformPaySupport()

	return {
		...stripeNative,
		isCheckingPlatformPay: isChecking,
		isPlatformPaySupported,
	}
}
