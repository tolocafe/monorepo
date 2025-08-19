import { StyleSheet } from 'react-native-unistyles'

const lightTheme = {
	borderRadius: {
		full: 9999,
		lg: 16,
		md: 12,
		sm: 8,
		xl: 24,
		xs: 4,
	} as const,
	colors: {
		background: '#F8F8F1',
		border: '#E0E0E0',
		error: '#D32F2F',
		primary: '#3D6039',
		surface: '#FFFFFF',
		text: '#0C0C0C',
		textSecondary: '#121212',
		textTertiary: '#666666',
	},
	fontSizes: {
		lg: 18,
		md: 16,
		sm: 14,
		xl: 20,
		xs: 12,
		xxl: 24,
		xxxl: 32,
	} as const,
	fontWeights: {
		bold: '700',
		medium: '500',
		regular: '400',
		semibold: '600',
	} as const,
	layout: {
		screenPadding: 18,
	} as const,
	spacing: {
		lg: 16,
		md: 12,
		sm: 8,
		xl: 24,
		xs: 4,
		xxl: 32,
	} as const,
	typography: {
		body: {
			fontSize: 17,
			fontWeight: '500',
		},
		button: {
			fontSize: 15,
			fontWeight: '600',
			letterSpacing: 0.5,
		},
		caption: {
			fontSize: 15,
			fontWeight: '400',
		},
		h1: {
			fontSize: 32,
			fontWeight: '800',
		},
		h2: {
			fontSize: 24,
			fontWeight: '700',
		},
		h3: {
			fontSize: 20,
			fontWeight: '800',
		},
		h4: {
			fontSize: 18,
			fontWeight: '600',
		},
		input: {
			fontSize: 16,
			fontWeight: '500',
		},
	} as const,
}

const darkTheme = {
	...lightTheme,
	colors: {
		background: '#121212',
		border: '#333333',
		error: '#EF5350',
		primary: '#8BC34A',
		surface: '#1E1E1E',
		text: '#FFFFFF',
		textSecondary: '#999999',
		textTertiary: '#666666',
	} satisfies (typeof lightTheme)['colors'],
}

export const breakpoints = {
	/* eslint-disable perfectionist/sort-objects */
	xs: 0,
	sm: 576,
	md: 768,
	lg: 992,
	xl: 1200,
	superLarge: 2000,
	tvLike: 4000,
	/* eslint-enable perfectionist/sort-objects */
} as const

const themes = {
	dark: darkTheme,
	light: lightTheme,
}

StyleSheet.configure({
	breakpoints,
	settings: { adaptiveThemes: true },
	themes,
})

type AppBreakpoints = typeof breakpoints
type AppThemes = typeof themes

declare module 'react-native-unistyles' {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions
	export interface UnistylesBreakpoints extends AppBreakpoints {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions
	export interface UnistylesThemes extends AppThemes {}
}
