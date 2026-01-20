import { globalStyle, style } from '@vanilla-extract/css'

import { vars } from './tokens.css'

/**
 * CSS Reset + Global styles using vanilla-extract
 *
 * These styles apply globally to elements based on the current theme.
 * The theme class (lightTheme or darkTheme) should be applied to a parent element.
 */

/* 1. Use a more-intuitive box-sizing model */
globalStyle('*, *::before, *::after', {
	boxSizing: 'border-box',
})

/* 2. Remove default margin (except dialog) */
globalStyle('*:not(dialog)', {
	margin: 0,
})

/* 3. Enable keyword animations */
globalStyle('html', {
	'@media': {
		'(prefers-reduced-motion: no-preference)': {
			interpolateSize: 'allow-keywords',
		},
	},
})

/* 4-5. Body base styles */
globalStyle('body', {
	WebkitFontSmoothing: 'antialiased',
	backgroundColor: vars.color.background,
	color: vars.color.text,
	fontFamily: vars.font.body,
	fontSize: vars.fontSize.base,
	lineHeight: 1.5,
})

/* 6. Improve media defaults */
globalStyle('img, picture, video, canvas, svg', {
	display: 'block',
	maxWidth: '100%',
})

/* 7. Inherit fonts for form controls */
globalStyle('input, button, textarea, select', {
	font: 'inherit',
})

/* 8. Avoid text overflows */
globalStyle('p, h1, h2, h3, h4, h5, h6', {
	overflowWrap: 'break-word',
})

/* 9. Improve line wrapping */
globalStyle('p', {
	textWrap: 'pretty',
})

globalStyle('h1, h2, h3, h4, h5, h6', {
	fontFamily: vars.font.heading,
	fontWeight: vars.fontWeight.bold,
	lineHeight: vars.lineHeight.tight,
	textWrap: 'balance',
})

// H1 needs a tighter leading than the rest for cleaner hero + page titles.
globalStyle('h1', {
	lineHeight: vars.lineHeight.none,
})

globalStyle('h1, h2, h3', {
	color: vars.color.secondary,
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
})

/* 10. Create a root stacking context */
globalStyle('#root, #__next', {
	isolation: 'isolate',
})

/* Additional theme-aware styles */
globalStyle('a', {
	color: vars.color.primary,
	textDecoration: 'none',
})

globalStyle('code, pre', {
	fontFamily: vars.font.mono,
})

/**
 * Reusable Component Styles
 *
 * Common patterns for buttons, cards, and sections that can be composed throughout the app.
 */

// Base button style - can be extended with specific variants
export const buttonBase = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.primary}`,
		outlineOffset: '2px',
	},
	alignItems: 'center',
	border: 'none',
	borderRadius: vars.radius.full,
	cursor: 'pointer',
	display: 'inline-flex',
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.semibold,
	justifyContent: 'center',
	padding: `${vars.space[3]} ${vars.space[5]}`,
	textDecoration: 'none',
})

export const buttonPrimary = style([
	buttonBase,
	{
		':hover': {
			filter: 'brightness(1.05)',
		},
		backgroundColor: vars.color.primary,
		color: vars.color.white,
	},
])

export const buttonSecondary = style([
	buttonBase,
	{
		':hover': {
			filter: 'brightness(1.05)',
		},
		backgroundColor: vars.color.secondary,
		color: vars.color.white,
	},
])

export const buttonOutline = style([
	buttonBase,
	{
		':hover': {
			backgroundColor: vars.color.surface,
		},
		backgroundColor: 'transparent',
		border: `1px solid ${vars.color.border}`,
		color: vars.color.text,
	},
])

export const buttonGhost = style([
	buttonBase,
	{
		':hover': {
			backgroundColor: 'rgba(255, 255, 255, 0.16)',
		},
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		border: '1px solid rgba(255, 255, 255, 0.35)',
		color: vars.color.white,
	},
])

export const buttonLight = style([
	buttonBase,
	{
		':hover': {
			filter: 'brightness(0.98)',
		},
		backgroundColor: vars.color.white,
		color: vars.color.primary,
	},
])

// Cards
export const card = style({
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius['2xl'],
	padding: vars.space[6],
})

export const cardCompact = style([
	card,
	{
		padding: vars.space[4],
	},
])

export const cardHover = style([
	card,
	{
		':hover': {
			filter: 'brightness(0.98)',
		},
	},
])

// Sections
export const section = style({
	padding: `${vars.space[16]} ${vars.space[6]}`,
})

export const sectionCompact = style([
	section,
	{
		padding: `${vars.space[10]} ${vars.space[6]}`,
	},
])

export const container = style({
	margin: '0 auto',
	maxWidth: '1200px',
})

export const containerWide = style({
	margin: '0 auto',
	maxWidth: '1100px',
})

export const containerNarrow = style({
	margin: '0 auto',
	maxWidth: '900px',
})

// Typography helpers
export const textLarge = style({
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
})

export const textCenter = style({
	textAlign: 'center',
})

export const textCentered = style({
	'@media': {
		'(min-width: 768px)': {
			textAlign: 'left',
		},
	},
	textAlign: 'center',
})

// Layout helpers
export const grid2 = style({
	'@media': {
		'(min-width: 768px)': {
			gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space[6],
	gridTemplateColumns: '1fr',
})

export const grid3 = style({
	'@media': {
		'(min-width: 768px)': {
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space[6],
	gridTemplateColumns: '1fr',
})

export const flexRow = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[3],
})

export const flexColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[4],
})

// Image placeholder
export const imagePlaceholder = style({
	backgroundColor: vars.color.border,
	borderRadius: vars.radius['2xl'],
	overflow: 'hidden',
})
