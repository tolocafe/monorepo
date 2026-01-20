import { PostHogProvider } from '@posthog/react'
import posthog from 'posthog-js'
import { useEffect, useState } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
	const [hydrated, setHydrated] = useState(false)

	useEffect(() => {
		// Only initialize on the client side after hydration
		// oxlint-disable-next-line unicorn/prefer-global-this
		if (typeof window !== 'undefined') {
			const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
			const apiHost =
				import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

			if (apiKey) {
				posthog.init(apiKey, {
					api_host: apiHost,
					capture_pageview: false,
					person_profiles: 'identified_only', // Disable automatic pageview capture, we'll capture manually
				})
			}
			setHydrated(true)
		}
	}, [])

	// Don't wrap with PostHogProvider until hydrated to avoid SSR issues
	if (!hydrated) return <>{children}</>

	return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
