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

export const article = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const header = style({
	marginBottom: vars.space.md,
})

export const title = style({
	lineHeight: vars.lineHeight.tight,
	marginBottom: vars.space.sm,
})

export const location = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.medium,
})

export const upcomingBadge = style({
	backgroundColor: vars.color.secondary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	display: 'inline-block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	marginTop: vars.space.sm,
	padding: `${vars.space.xs} ${vars.space.md}`,
	textTransform: 'uppercase',
})

export const imageWrapper = style({
	aspectRatio: '16 / 9',
	borderRadius: vars.radius.lg,
	overflow: 'hidden',
	width: '100%',
})

export const image = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const body = style({
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
})

export const heading2 = style({
	marginBottom: vars.space.md,
	marginTop: vars.space.xl,
})

export const heading3 = style({
	marginBottom: vars.space.md,
	marginTop: vars.space.xl,
})

export const paragraph = style({
	marginBottom: vars.space.md,
})

export const list = style({
	marginBottom: vars.space.md,
	marginLeft: vars.space.xl,
})

export const listItem = style({
	marginBottom: vars.space.sm,
})

export const detailsGrid = style({
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.lg,
	display: 'grid',
	gap: vars.space.md,
	gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
	fontWeight: vars.fontWeight.normal,
	whiteSpace: 'pre-line',
})

export const detailLink = style({
	color: vars.color.primary,
	fontWeight: vars.fontWeight.medium,
	textDecoration: 'none',
})

export const mapWrapper = style({
	borderRadius: vars.radius.lg,
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
	padding: vars.space.xl,
	textAlign: 'center',
})

export const notFoundTitle = style({
	marginBottom: vars.space.md,
})

export const notFoundText = style({
	fontSize: vars.fontSize.lg,
	marginBottom: vars.space.xl,
})
