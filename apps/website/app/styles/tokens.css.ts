import {
	createGlobalTheme,
	createThemeContract,
	globalStyle,
	assignVars,
} from '@vanilla-extract/css'

/**
 * Design Tokens using vanilla-extract
 *
 * This file defines the design system tokens for colors, spacing, typography, etc.
 * Uses createGlobalTheme on :root for automatic system-preference-based theming.
 */

// Theme contract defines the structure of our theme tokens
export const vars = createThemeContract({
	color: {
		background: null,
		border: null,
		primary: null,
		secondary: null,
		surface: null,
		text: null,
		white: null,
	},
	font: {
		body: null,
		heading: null,
		mono: null,
	},
	fontSize: {
		'2xl': null,
		'3xl': null,
		'4xl': null,
		base: null,
		lg: null,
		sm: null,
		xl: null,
		xs: null,
	},
	fontWeight: {
		bold: null,
		medium: null,
		normal: null,
		semibold: null,
	},
	lineHeight: {
		none: null,
		normal: null,
		relaxed: null,
		tight: null,
	},
	radius: {
		'2xl': null,
		'3xl': null,
		full: null,
		lg: null,
		md: null,
		none: null,
		sm: null,
		xl: null,
	},
	space: {
		'2xl': null,
		'3xl': null,
		'4xl': null,
		'5xl': null,
		'6xl': null,
		'7xl': null,
		base: null,
		lg: null,
		md: null,
		none: null,
		sm: null,
		xl: null,
		xs: null,
	},
})

// Shared non-color tokens (same for light and dark)
const sharedTokens = {
	font: {
		body: '"Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
		heading:
			'"Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
		mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
	},
	fontSize: {
		'2xl': '1.5rem',
		'3xl': '1.875rem',
		'4xl': '2.25rem',
		base: '1rem',
		lg: '1.125rem',
		sm: '0.875rem',
		xl: '1.25rem',
		xs: '0.75rem',
	},
	fontWeight: {
		bold: '900',
		medium: '600',
		normal: '500',
		semibold: '700',
	},
	lineHeight: {
		none: '1',
		normal: '1.5',
		relaxed: '1.75',
		tight: '1.25',
	},
	radius: {
		'2xl': '1rem',
		'3xl': '1.5rem',
		full: '9999px',
		lg: '0.5rem',
		md: '0.375rem',
		none: '0',
		sm: '0.125rem',
		xl: '0.75rem',
	},
	space: {
		'2xl': '2rem',
		'3xl': '2.5rem',
		'4xl': '3rem',
		'5xl': '4rem',
		'6xl': '5rem',
		'7xl': '6rem',
		base: '1rem',
		lg: '1.25rem',
		md: '0.75rem',
		none: '0',
		sm: '0.5rem',
		xl: '1.5rem',
		xs: '0.25rem',
	},
}

// TOLO Brand Colors - Light theme
const lightColors = {
	background: '#F5F0E8',
	border: '#D4CFC5',
	primary: '#3D6039',
	secondary: '#C44536',
	surface: '#FFFFFF',
	text: '#333333',
	white: '#FFFFFF',
}

// TOLO Brand Colors - Dark theme
const darkColors = {
	background: '#1A1A1A',
	border: '#3D3D3D',
	primary: '#4A7345',
	secondary: '#D9594A',
	surface: '#2A2A2A',
	text: '#F5F0E8',
	white: '#FFFFFF',
}

// Apply light theme to :root (default)
createGlobalTheme(':root', vars, {
	color: lightColors,
	...sharedTokens,
})

// Apply dark theme when system prefers dark mode
globalStyle(':root', {
	'@media': {
		'(prefers-color-scheme: dark)': {
			vars: assignVars(vars, {
				color: darkColors,
				...sharedTokens,
			}),
		},
	},
})

// Set color-scheme for proper browser UI (scrollbars, form controls, etc.)
globalStyle(':root', {
	colorScheme: 'light dark',
})
