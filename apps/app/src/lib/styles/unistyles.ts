import { Color } from 'expo-router'
import { Platform } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

const PRIMARY_SOLID_COLOR = Platform.select({
	android: Color.android.dynamic.primary,
	default: '#3D6039',
})

const PRIMARY_INTERACTIVE_COLOR = Platform.select({
	android: Color.android.dynamic.primaryContainer,
	default: '#DCEFD9',
})

const PRIMARY_BORDER_COLOR = Platform.select({
	android: Color.android.dynamic.primaryFixed,
	default: '#B0D1AB',
})

const lightTheme = {
	// oxlint-disable-next-line sort-keys
	borderRadius: {
		full: 9999,
		xl: Platform.select({ android: 20, default: 28 }),
		lg: Platform.select({ android: 14, default: 20 }),
		md: Platform.select({ android: 8, default: 12 }),
		sm: Platform.select({ android: 5, default: 8 }),
		xs: Platform.select({ android: 2, default: 4 }),
	} as const,
	colors: {
		// Warning - Amarillo (Yellow)
		amarillo: {
			background: '#FDFDF9',
			border: '#FEF3C7',
			interactive: '#FFDC9E',
			solid: '#F5D90A',
			text: '#000000',
		},
		// Error - Rojo (Red)
		error: {
			background: '#FFFCFC',
			border: '#FFEFEF',
			interactive: '#FFD5D9',
			solid: Platform.select({
				android: Color.android.dynamic.error,
				default: '#E5484D',
			}),
			text: '#FFFFFF',
		},
		// Text and backgrounds - Gray
		gray: {
			background: '#ffffff',
			border: '#F4F4F4',
			interactive: '#E3E3E3',
			solid: '#666666',
			text: '#111111',
		},
		// Primary accent - Verde (Green)
		primary: {
			background: '#F6FBF5',
			border: PRIMARY_BORDER_COLOR,
			interactive: PRIMARY_INTERACTIVE_COLOR,
			solid: PRIMARY_SOLID_COLOR,
			text: '#20311E',
		},
		// Secondary accent - Naranja (Orange)
		secondary: {
			background: '#FEFCFB',
			border: '#FFEDE5',
			interactive: '#FFD0A5',
			solid: '#F76B15',
			text: '#893C0C',
		},
	},
	fontSizes: {
		/** body, p, text input  */
		/* eslint-disable perfectionist/sort-objects */
		lg: 18,
		md: 16,
		sm: 15,
		xl: 20,
		xs: 14,
		xxl: 24,
		xxxl: 32,
		/* eslint-enable perfectionist/sort-objects */
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
		xxs: 2,
	} as const,
	typography: {
		body: {
			fontSize: 17,
			fontWeight: '500',
		},
		button: {
			fontSize: 15,
			fontWeight: '700',
			letterSpacing: 0.5,
		},
		caption: {
			fontSize: 15,
			fontWeight: '400',
		},
		h1: {
			fontSize: 28,
			fontWeight: '900',
		},
		h2: {
			fontSize: 23,
			fontWeight: '800',
		},
		h3: {
			fontSize: 21,
			fontWeight: '700',
		},
		h4: {
			fontSize: 19,
			fontWeight: '600',
		},
		h5: {
			fontSize: 17,
			fontWeight: '600',
		},
		h6: {
			fontSize: 16,
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
		// Warning - Amarillo (Yellow)
		amarillo: {
			background: '#1C1500',
			border: '#2A1F00',
			interactive: '#5C4600',
			solid: '#F5D90A',
			text: '#000000',
		},
		// Error - Rojo (Red)
		error: {
			background: '#201312',
			border: '#8C3434',
			interactive: '#500F13',
			solid: '#E5484D',
			text: '#FFD2CE',
		},
		// Text and backgrounds - Gray
		gray: {
			background: '#111111',
			border: '#1C1C1C',
			interactive: '#2A2A2A',
			solid: '#6E6E6E',
			text: '#FFFFFF',
		},
		// Primary accent - Verde (Green)
		primary: {
			background: '#141A13',
			border: '#41643D',
			interactive: '#253823',
			solid: '#3D6039',
			text: '#CEF5C9',
		},
		// Secondary accent - Naranja (Orange)
		secondary: {
			background: '#1F1206',
			border: '#2B1400',
			interactive: '#5F1F00',
			solid: '#F76B15',
			text: '#FFFFFF',
		},
	} satisfies (typeof lightTheme)['colors'],
}

// oxlint-disable-next-line sort-keys
export const breakpoints = {
	/** default */
	xs: 0,
	/** phone */
	sm: 576,
	/** tablet */
	md: 768,
	/** laptop */
	lg: 992,
	/** desktop */
	xl: 1200,
	/** tv */
	xxl: 4000,
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
