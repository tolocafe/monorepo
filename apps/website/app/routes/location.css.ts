import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space[12]} ${vars.space[6]}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const article = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[8],
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
	marginBottom: vars.space[2],
})

export const location = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.medium,
})

export const imageWrapper = style({
	aspectRatio: '16 / 9',
	borderRadius: vars.radius['2xl'],
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

export const heading2 = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[4],
	marginTop: vars.space[8],
})

export const heading3 = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[3],
	marginTop: vars.space[6],
})

export const paragraph = style({
	marginBottom: vars.space[4],
})

export const list = style({
	marginBottom: vars.space[4],
	marginLeft: vars.space[6],
})

export const listItem = style({
	marginBottom: vars.space[2],
})

export const detailsGrid = style({
	backgroundColor: vars.color.secondary,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.xl,
	display: 'grid',
	gap: vars.space[4],
	gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
	padding: vars.space[6],
})

export const detailItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[1],
})

export const detailLabel = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	letterSpacing: '0.05em',
	textTransform: 'uppercase',
})

export const detailValue = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.normal,
	whiteSpace: 'pre-line',
})

export const detailLink = style({
	':hover': {
		textDecoration: 'underline',
	},
	color: vars.color.primary,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	textDecoration: 'none',
})

export const mapWrapper = style({
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.xl,
	height: '400px',
	overflow: 'hidden',
	width: '100%',
})

export const map = style({
	border: 'none',
	display: 'block',
	height: '100%',
	width: '100%',
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
