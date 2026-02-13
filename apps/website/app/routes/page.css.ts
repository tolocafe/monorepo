import { style } from '@vanilla-extract/css'

import { vars } from '@/styles/tokens.css'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space.xl} ${vars.space.xl}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const header = style({
	marginBottom: vars.space.xl,
	textAlign: 'center',
})

export const title = style({
	lineHeight: vars.lineHeight.tight,
})

export const body = style({
	lineHeight: vars.lineHeight.relaxed,
})

// Portable Text styles
export const paragraph = style({
	marginBottom: vars.space.xl,
})

export const heading2 = style({
	marginBottom: vars.space.md,
	marginTop: vars.space.xl,
})

export const heading3 = style({
	marginBottom: vars.space.md,
	marginTop: vars.space.xl,
})

export const blockquote = style({
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
	padding: vars.space.xl,
	textAlign: 'center',
})

export const notFoundTitle = style({
	marginBottom: vars.space.md,
})

export const notFoundText = style({
	fontSize: vars.fontSize.lg,
})

export const aboutLinks = style({
	display: 'flex',
	gap: vars.space.lg,
	justifyContent: 'center',
	marginTop: vars.space.xl,
	paddingTop: vars.space.xl,
})

export const aboutLink = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.medium,
	textDecoration: 'none',
})

// App download section styles
export const downloadSection = style({
	marginTop: vars.space.xl,
	paddingTop: vars.space.xl,
	textAlign: 'center',
})

export const downloadTitle = style({
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
	display: 'block',
})

export const storeBadge = style({
	height: '48px',
	width: 'auto',
})
