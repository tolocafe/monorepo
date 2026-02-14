import * as Sentry from '@sentry/react-native'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN

Sentry.init({
	dsn,
	integrations: [
		Sentry.feedbackIntegration(),
		Sentry.screenshotIntegration(),
		Sentry.mobileReplayIntegration(),
	],
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0.1,
	sendDefaultPii: true,
	tracesSampleRate: 0.5,
})
