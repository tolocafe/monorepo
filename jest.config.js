/* eslint-disable no-undef */

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
	projects: [
		// For utility tests (no React Native components)
		{
			displayName: 'utils',
			moduleNameMapper: {
				'^@/(.*)$': '<rootDir>/src/$1',
				'^@common/(.*)$': '<rootDir>/common/$1',
			},
			testEnvironment: 'node',
			testMatch: [
				'<rootDir>/src/lib/utils/**/*.test.ts',
				'<rootDir>/src/lib/hooks/**/*.test.ts',
				'<rootDir>/src/lib/queries/**/*.test.ts',
			],
		},
		// For component tests (React Native/Expo components)
		{
			displayName: 'components',
			moduleNameMapper: {
				'^@/(.*)$': '<rootDir>/src/$1',
				'^@common/(.*)$': '<rootDir>/common/$1',
			},
			preset: 'react-native',
			setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
			testMatch: [
				'<rootDir>/src/components/**/*.test.tsx',
				'<rootDir>/src/app/**/*.test.tsx',
				'<rootDir>/src/lib/contexts/**/*.test.tsx',
				'<rootDir>/src/lib/hooks/**/*.test.tsx',
			],
			transformIgnorePatterns: [
				'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-unistyles|@bottom-tabs|react-native-mmkv|zustand|ky))',
			],
		},
	],
}
