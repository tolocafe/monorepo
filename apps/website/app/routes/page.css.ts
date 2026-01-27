import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space['4xl']} ${vars.space.xl}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const header = style({
	marginBottom: vars.space['2xl'],
	textAlign: 'center',
})

export const title = style({
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize['3xl'],
		},
	},
	fontSize: vars.fontSize['4xl'],
	fontWeight: vars.fontWeight.bold,
	lineHeight: vars.lineHeight.tight,
})

export const body = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
})

// Portable Text styles
export const paragraph = style({
	marginBottom: vars.space.xl,
})

export const heading2 = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space.base,
	marginTop: vars.space['2xl'],
})

export const heading3 = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space.md,
	marginTop: vars.space.xl,
})

export const blockquote = style({
	borderLeft: `4px solid ${vars.color.secondary}`,
	color: vars.color.text,
	fontStyle: 'italic',
	marginBottom: vars.space.xl,
	marginLeft: 0,
	marginRight: 0,
	marginTop: vars.space.xl,
	paddingLeft: vars.space.xl,
})

export const list = style({
	marginBottom: vars.space.xl,
	paddingLeft: vars.space.xl,
})

export const listItem = style({
	marginBottom: vars.space.sm,
})

export const link = style({
	color: vars.color.secondary,
	textDecoration: 'underline',
})

export const notFound = style({
	padding: vars.space['4xl'],
	textAlign: 'center',
})

export const notFoundTitle = style({
	fontSize: vars.fontSize['3xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space.base,
})

export const notFoundText = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
})

export const aboutLinks = style({
	borderTop: `1px solid ${vars.color.surface}`,
	display: 'flex',
	gap: vars.space.lg,
	justifyContent: 'center',
	marginTop: vars.space['2xl'],
	paddingTop: vars.space['2xl'],
})

export const aboutLink = style({
	':hover': {
		textDecoration: 'underline',
	},
	color: vars.color.secondary,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.medium,
	textDecoration: 'none',
})

// App download section styles
export const downloadSection = style({
	borderTop: `1px solid ${vars.color.surface}`,
	marginTop: vars.space['3xl'],
	paddingTop: vars.space['2xl'],
	textAlign: 'center',
})

export const downloadTitle = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space.xl,
})

export const storeLinks = style({
	'@media': {
		'(max-width: 480px)': {
			flexDirection: 'column',
		},
	},
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.lg,
	justifyContent: 'center',
})

export const storeLink = style({
	':hover': {
		opacity: 0.8,
	},
	display: 'block',
	transition: 'opacity 0.2s ease',
})

export const storeBadge = style({
	height: '48px',
	width: 'auto',
})
