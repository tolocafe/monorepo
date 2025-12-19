import type { ReactNode } from 'react'
import { View } from 'react-native'

import { ErrorBoundary } from '@sentry/react-native'

type Props = {
	children: ReactNode
}

const sectionFallback = <View aria-hidden />

/**
 * Error boundary wrapper for home screen sections.
 * Returns empty View on error to prevent section crashes from affecting the entire screen.
 */
export function SectionErrorBoundary({ children }: Props) {
	return <ErrorBoundary fallback={sectionFallback}>{children}</ErrorBoundary>
}
