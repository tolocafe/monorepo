import { style } from '@vanilla-extract/css'

import { vars } from '~/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space[12]} ${vars.space[6]}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const backLink = style({
	alignItems: 'center',
	color: vars.color.secondary,
	display: 'inline-flex',
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	gap: vars.space[2],
	marginBottom: vars.space[8],
	textDecoration: 'none',
})

export const article = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[6],
})

export const header = style({
	marginBottom: vars.space[4],
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
	marginBottom: vars.space[4],
})

export const meta = style({
	alignItems: 'center',
	color: vars.color.text,
	display: 'flex',
	fontSize: vars.fontSize.base,
	gap: vars.space[4],
})

export const date = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space[2],
})

export const imageWrapper = style({
	aspectRatio: '16 / 9',
	borderRadius: vars.radius['2xl'],
	marginBottom: vars.space[4],
	overflow: 'hidden',
	width: '100%',
})

export const image = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const body = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
})

// Portable Text block styles
export const paragraph = style({
	marginBottom: vars.space[6],
})

export const heading2 = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[4],
	marginTop: vars.space[8],
})

export const heading3 = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[3],
	marginTop: vars.space[6],
})

export const blockquote = style({
	borderLeft: `4px solid ${vars.color.secondary}`,
	color: vars.color.text,
	fontStyle: 'italic',
	marginBottom: vars.space[6],
	marginLeft: 0,
	marginRight: 0,
	marginTop: vars.space[6],
	paddingLeft: vars.space[6],
})

export const list = style({
	marginBottom: vars.space[6],
	paddingLeft: vars.space[6],
})

export const listItem = style({
	marginBottom: vars.space[2],
})

export const link = style({
	color: vars.color.secondary,
	textDecoration: 'underline',
})

export const notFound = style({
	padding: vars.space[12],
	textAlign: 'center',
})

export const notFoundTitle = style({
	fontSize: vars.fontSize['3xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[4],
})

export const notFoundText = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	marginBottom: vars.space[8],
})
