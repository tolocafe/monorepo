/* eslint-disable unicorn/no-keyword-prefix, unicorn/no-anonymous-default-export */
import type { ExpoConfig } from 'expo/config'

const projectId = '25e3751a-b837-480a-b9fc-ee67327f46e9'

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
	...config,
	android: {
		adaptiveIcon: {
			backgroundColor: '#ffffff',
			foregroundImage: './src/assets/images/adaptive-icon.png',
		},
		edgeToEdgeEnabled: true,
		googleServicesFile: './google-services.json',
		package: 'cafe.tolo.app',
	},
	experiments: {
		typedRoutes: true,
	},
	extra: {
		eas: {
			projectId,
		},
		router: {
			headOrigin: 'https://app.tolo.cafe',
		},
	},
	icon: './src/assets/images/icon.png',
	ios: {
		associatedDomains: [
			'applinks:app.tolo.cafe',
			'activitycontinuation:app.tolo.cafe',
			'webcredentials:app.tolo.cafe',
		],
		bundleIdentifier: 'cafe.tolo.app',
		config: {
			usesNonExemptEncryption: false,
		},
		googleServicesFile: './GoogleService-Info.plist',
		supportsTablet: true,
	},
	name: 'TOLO',
	newArchEnabled: true,
	orientation: 'portrait',
	owner: 'tolo-cafe',
	plugins: [
		'expo-updates',
		'expo-notifications',
		'react-native-edge-to-edge',
		['expo-router', { headOrigin: 'https://app.tolo.cafe' }],
		['react-native-bottom-tabs', { theme: 'material3-dynamic' }],
		['expo-build-properties', { ios: { useFrameworks: 'static' } }],
		// [
		// 	'@stripe/stripe-react-native',
		// 	{
		// 		enableGooglePay: true,
		// 		merchantIdentifier: 'merchant.cafe.tolo.app',
		// 	},
		// ],
		[
			'expo-secure-store',
			{
				configureAndroidBackup: true,
				faceIDPermission:
					'This will allow you to sign in and access your account',
			},
		],
		[
			'expo-splash-screen',
			{
				backgroundColor: '#ffffff',
				image: './src/assets/images/splash-icon.png',
				imageWidth: 200,
				resizeMode: 'contain',
			},
		],
		[
			'expo-tracking-transparency',
			{
				userTrackingPermission:
					'This will allow us to deliver personalized ads to you.',
			},
		],
	],
	runtimeVersion: {
		policy: 'fingerprint',
	},
	scheme: 'tolo',
	slug: 'tolo',
	updates: {
		checkAutomatically: 'ON_LOAD',
		enabled: true,
		fallbackToCacheTimeout: 3000,
		url: `https://u.expo.dev/${projectId}`,
	},
	userInterfaceStyle: 'automatic',
	version: '1.1.1',
	web: {
		backgroundColor: '#ffffff',
		bundler: 'metro',
		description:
			'TOLO - Buen Café. Tu cafetería de barrio donde cada taza cuenta una historia',
		display: 'standalone',
		favicon: './src/assets/images/favicon.png',
		lang: 'es',
		name: 'TOLO - Buen Café',
		orientation: 'portrait',
		output: 'static',
		shortName: 'TOLO',
		startUrl: '/',
		themeColor: '#ffffff',
	},
})
