import { Stripe } from 'stripe'

export function getStripe(secretKey: string) {
	return new Stripe(secretKey, {
		apiVersion: '2025-08-27.basil',
		timeout: 30 * 1000,
	})
}
