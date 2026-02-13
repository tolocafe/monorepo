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
	fontSize: vars.fontSize.md,
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
	fontSize: vars.fontSize.xl,
	lineHeight: vars.lineHeight.none,
})

globalStyle('h1, h2, h3', {
	color: vars.color.secondary,
	fontWeight: vars.fontWeight.bold,
})

globalStyle('h2', {
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
})

globalStyle('h3', {
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
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

globalStyle('button', {
	alignItems: 'center',
	border: 'none',
	borderRadius: vars.radius.full,
	cursor: 'pointer',
	display: 'inline-flex',
	fontWeight: vars.fontWeight.semibold,
	justifyContent: 'center',
	padding: `${vars.space.md} ${vars.space.lg}`,
	textDecoration: 'none',
})

globalStyle('button:focus-visible', {
	outline: `2px solid ${vars.color.primary}`,
	outlineOffset: '2px',
})

export const buttonPrimary = style({
	backgroundColor: vars.color.primary,
	color: vars.color.white,
})

export const buttonSecondary = style({
	backgroundColor: vars.color.secondary,
	color: vars.color.white,
})

export const buttonOutline = style({
	backgroundColor: 'transparent',
	color: vars.color.text,
})

export const buttonGhost = style({
	backgroundColor: 'rgba(255, 255, 255, 0.1)',
	color: vars.color.white,
})

export const buttonLight = style({
	backgroundColor: vars.color.white,
	color: vars.color.primary,
})

// Cards
export const card = style({
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.lg,
	padding: vars.space.xl,
})

export const cardCompact = style([
	card,
	{
		padding: vars.space.md,
	},
])

export const cardHover = style([card])

// Sections
export const section = style({
	'@media': {
		'(min-width: 768px)': {
			padding: `${vars.space.xl} ${vars.space.xl}`,
		},
	},
	padding: `${vars.space.xl} ${vars.space.xl}`,
})

export const sectionCompact = style([
	section,
	{
		'@media': {
			'(min-width: 768px)': {
				padding: `${vars.space.lg} ${vars.space.xl}`,
			},
		},
		padding: `${vars.space.lg} ${vars.space.xl}`,
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
	gap: vars.space.xl,
	gridTemplateColumns: '1fr',
})

export const grid3 = style({
	'@media': {
		'(min-width: 768px)': {
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: '1fr',
})

export const flexRow = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space.md,
})

export const flexColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

// Image placeholder
export const imagePlaceholder = style({
	backgroundColor: vars.color.border,
	borderRadius: vars.radius.lg,
	overflow: 'hidden',
})

// Page main wrapper
export const pageMain = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space.xl} ${vars.space.xl}`,
})

// Back link navigation
export const backLink = style({
	color: vars.color.primary,
	display: 'inline-block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	marginBottom: vars.space.lg,
	textDecoration: 'none',
})

// Quantity controls for cart/product
export const quantityControls = style({
	alignItems: 'center',
	borderRadius: vars.radius.md,
	display: 'flex',
	overflow: 'hidden',
})

export const quantityButton = style({
	':disabled': {
		cursor: 'not-allowed',
		opacity: 0.5,
	},
	alignItems: 'center',
	backgroundColor: 'transparent',
	border: 'none',
	cursor: 'pointer',
	display: 'flex',
	height: '40px',
	justifyContent: 'center',
	width: '40px',
})

export const quantityButtonSmall = style([
	quantityButton,
	{
		height: '36px',
		width: '36px',
	},
])

export const quantityValue = style({
	alignItems: 'center',
	display: 'flex',
	fontWeight: vars.fontWeight.medium,
	height: '40px',
	justifyContent: 'center',
	minWidth: '50px',
})

export const quantityValueSmall = style([
	quantityValue,
	{
		fontSize: vars.fontSize.sm,
		height: '36px',
		minWidth: '40px',
	},
])

// Empty state styles
export const emptyState = style({
	padding: vars.space.xl,
	textAlign: 'center',
})

export const emptyStateCard = style([
	emptyState,
	{
		backgroundColor: vars.color.surface,
		borderRadius: vars.radius.lg,
	},
])

export const emptyTitle = style({
	marginBottom: vars.space.md,
})

export const emptyMessage = style({
	lineHeight: vars.lineHeight.relaxed,
})

// Page header pattern (centered with title + subtitle)
export const pageHeader = style({
	marginBottom: vars.space.xl,
	textAlign: 'center',
})

export const pageHeading = style({
	marginBottom: vars.space.md,
})

export const pageSubtitle = style({
	fontSize: vars.fontSize.lg,
})
