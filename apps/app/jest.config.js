/** @type {import('jest').Config} */
module.exports = {
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/index.ts',
		'!src/lib/locales/**',
		'!**/__tests__/**',
		'!**/coverage/**',
		'!**/node_modules/**',
	],
	globals: {
		__DEV__: true,
	},
	projects: [
		// For pure utility tests (no React Native dependencies)
		{
			displayName: 'utils',
			globals: {
				__DEV__: true,
			},
			moduleNameMapper: {
				'^~/(.*)$': '<rootDir>/src/$1',
			},
			rootDir: __dirname,
			testEnvironment: 'node',
			testMatch: [
				'<rootDir>/src/lib/utils/__tests__/phone.test.ts',
				'<rootDir>/src/lib/hooks/__tests__/*.test.ts',
				'<rootDir>/src/lib/constants/__tests__/*.test.ts',
				'<rootDir>/src/lib/locales/__tests__/*.test.ts',
				'<rootDir>/src/lib/services/__tests__/*.test.ts',
			],
		},
		// For React Native/Expo tests (components, queries, stores, and utils with RN deps)
		{
			displayName: 'react-native',
			globals: {
				__DEV__: true,
			},
			moduleNameMapper: {
				'^~/(.*)$': '<rootDir>/src/$1',
			},
			preset: 'jest-expo',
			rootDir: __dirname,
			setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
			testMatch: [
				'<rootDir>/src/components/__tests__/*.test.tsx',
				'<rootDir>/src/app/**/__tests__/*.test.tsx',
				'<rootDir>/src/lib/contexts/__tests__/*.test.tsx',
				'<rootDir>/src/lib/queries/__tests__/*.test.ts',
				'<rootDir>/src/lib/stores/__tests__/*.test.ts',
				'<rootDir>/src/lib/utils/__tests__/price.test.ts',
			],
			transformIgnorePatterns: [
				'node_modules/(?!(.bun/[^/]+/node_modules/)?(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-unistyles|@bottom-tabs|react-native-mmkv|zustand|ky|@tanstack))',
			],
		},
	],
}
