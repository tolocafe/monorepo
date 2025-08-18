import type { PropsWithChildren, ReactElement } from 'react'

import { StripeProvider } from '@stripe/stripe-react-native'

export default function Stripe({ children }: PropsWithChildren) {
	return (
		<StripeProvider
			merchantIdentifier={process.env.EXPO_PUBLIC_MERCHANT_IDENTIFIER as string}
			publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string}
			urlScheme="tolo"
		>
			{children as ReactElement}
		</StripeProvider>
	)
}
