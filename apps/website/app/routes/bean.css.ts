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

export const backLink = style({
	alignItems: 'center',
	color: vars.color.secondary,
	display: 'inline-flex',
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	gap: vars.space.sm,
	marginBottom: vars.space['2xl'],
	textDecoration: 'none',
})

export const article = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space['2xl'],
})

export const header = style({
	marginBottom: vars.space.base,
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
	marginBottom: vars.space.sm,
})

export const origin = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.medium,
})

export const excerpt = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
	marginTop: vars.space.base,
})

export const imageWrapper = style({
	aspectRatio: '16 / 10',
	borderRadius: vars.radius['2xl'],
	overflow: 'hidden',
	width: '100%',
})

export const image = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const detailsGrid = style({
	backgroundColor: vars.color.secondary,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.xl,
	display: 'grid',
	gap: vars.space.base,
	gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
	padding: vars.space.xl,
})

export const detailItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xs,
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
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
})

export const tastingSection = style({
	backgroundColor: vars.color.background,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.xl,
	padding: vars.space.xl,
})

export const sectionTitle = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space.md,
})

export const tastingNotes = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
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
	marginBottom: vars.space['2xl'],
})
