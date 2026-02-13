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
		lg: null,
		md: null,
		sm: null,
		xl: null,
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
		full: null,
		lg: null,
		md: null,
		sm: null,
	},
	space: {
		lg: null,
		md: null,
		sm: null,
		xl: null,
		xs: null,
	},
})

// Shared non-color tokens (same for light and dark)
const sharedTokens = {
	font: {
		body: '"Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
		heading: '"Inter", ui-sans-serif, system-ui, sans-serif',
		mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
	},
	fontSize: {
		lg: '1.6rem',
		md: '1.15rem',
		sm: '0.95rem',
		xl: '2.4rem',
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
		full: '9999px',
		lg: '1rem',
		md: '0.5rem',
		sm: '0.25rem',
	},
	space: {
		lg: '2.5rem',
		md: '1.2rem',
		sm: '0.5rem',
		xl: '2.25rem',
		xs: '0.25rem',
	},
}

// TOLO Brand Colors - Light theme
const lightColors = {
	background: '#F4F4F4',
	border: '#D4CFC5',
	primary: '#3D6039',
	secondary: '#C44536',
	surface: '#FFFFFF',
	text: '#000000',
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
