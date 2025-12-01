import { Platform } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

const lightTheme = {
	borderRadius: {
		full: 9999,
		/* eslint-disable perfectionist/sort-objects  */
		xl: Platform.select({ android: 16, default: 24 }),
		lg: Platform.select({ android: 10, default: 16 }),
		md: Platform.select({ android: 8, default: 12 }),
		sm: Platform.select({ android: 5, default: 8 }),
		xs: Platform.select({ android: 2, default: 4 }),
		/* eslint-enable perfectionist/sort-objects  */
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
		// Secondary text and backgrounds - Crema (Sand)
		crema: {
			background: '#F8F8F1',
			border: '#F2F1F0',
			interactive: '#E9E8E6',
			solid: '#908E87',
			text: '#333333',
		},
		// Text and backgrounds - Gray
		gray: {
			background: '#ffffff',
			border: '#F4F4F4',
			interactive: '#E3E3E3',
			solid: '#666666',
			text: '#111111',
		},
		// Secondary accent - Naranja (Orange)
		naranja: {
			background: '#FEFCFB',
			border: '#FFEDE5',
			interactive: '#FFD0A5',
			solid: '#F76B15',
			text: '#893C0C',
		},
		// Error - Rojo (Red)
		rojo: {
			background: '#FFFCFC',
			border: '#FFEFEF',
			interactive: '#FFD5D9',
			solid: '#E5484D',
			text: '#FFFFFF',
		},
		// Primary accent - Verde (Green)
		verde: {
			background: '#F6FBF5',
			border: '#B0D1AB',
			interactive: '#DCEFD9',
			solid: '#3D6039',
			text: '#20311E',
		},
	},
	fontSizes: {
		lg: 18,
		/** body, p, text input  */
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
			fontSize: 32,
			fontWeight: '900',
		},
		h2: {
			fontSize: 24,
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
		// Secondary text and backgrounds - Crema (Sand)
		crema: {
			background: '#191915',
			border: '#494840',
			interactive: '#2A2A23',
			solid: '#989891',
			text: '#EEEEE7',
		},
		// Text and backgrounds - Gray
		gray: {
			background: '#111111',
			border: '#1C1C1C',
			interactive: '#2A2A2A',
			solid: '#6E6E6E',
			text: '#FFFFFF',
		},
		// Secondary accent - Naranja (Orange)
		naranja: {
			background: '#1F1206',
			border: '#2B1400',
			interactive: '#5F1F00',
			solid: '#F76B15',
			text: '#FFFFFF',
		},
		// Error - Rojo (Red)
		rojo: {
			background: '#201312',
			border: '#8C3434',
			interactive: '#500F13',
			solid: '#E5484D',
			text: '#FFD2CE',
		},
		// Primary accent - Verde (Green)
		verde: {
			background: '#141A13',
			border: '#41643D',
			interactive: '#253823',
			solid: '#3D6039',
			text: '#CEF5C9',
		},
	} satisfies (typeof lightTheme)['colors'],
}

export const breakpoints = {
	/* eslint-disable perfectionist/sort-objects */
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
