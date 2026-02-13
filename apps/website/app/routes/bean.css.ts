import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space.xl} ${vars.space.xl}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const backLink = style({
	alignItems: 'center',
	color: vars.color.secondary,
	display: 'inline-flex',
	fontWeight: vars.fontWeight.medium,
	gap: vars.space.sm,
	marginBottom: vars.space.lg,
	textDecoration: 'none',
})

export const article = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.lg,
})

export const header = style({
	marginBottom: vars.space.md,
})

export const title = style({
	lineHeight: vars.lineHeight.tight,
	marginBottom: vars.space.sm,
})

export const origin = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.medium,
})

export const excerpt = style({
	lineHeight: vars.lineHeight.relaxed,
	marginTop: vars.space.md,
})

export const imageWrapper = style({
	aspectRatio: '16 / 10',
	borderRadius: vars.radius.lg,
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
	borderRadius: vars.radius.lg,
	display: 'grid',
	gap: vars.space.md,
	gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
	padding: vars.space.xl,
})

export const detailItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xs,
})

export const detailLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	letterSpacing: '0.05em',
	textTransform: 'uppercase',
})

export const detailValue = style({
	fontWeight: vars.fontWeight.semibold,
})

export const tastingSection = style({
	backgroundColor: vars.color.background,
	borderRadius: vars.radius.lg,
	padding: vars.space.xl,
})

export const sectionTitle = style({
	marginBottom: vars.space.md,
})

export const tastingNotes = style({
	lineHeight: vars.lineHeight.relaxed,
})

export const notFound = style({
	padding: vars.space.xl,
	textAlign: 'center',
})

export const notFoundTitle = style({
	marginBottom: vars.space.md,
})

export const notFoundText = style({
	marginBottom: vars.space.lg,
})
