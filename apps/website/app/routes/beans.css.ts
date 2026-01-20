import { style } from '@vanilla-extract/css'

import { vars, containerWide } from '@/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space[12]} ${vars.space[6]}`,
})

export const container = containerWide

export const header = style({
	marginBottom: vars.space[12],
	textAlign: 'center',
})

export const heading = style({
	fontSize: vars.fontSize['4xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[4],
})

export const subtitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
})

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[12],
})

export const beansGrid = style({
	display: 'grid',
	gap: vars.space[6],
	gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
})

export const beanCard = style({
	':hover': {},
	backgroundColor: vars.color.background,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius['2xl'],
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	textDecoration: 'none',
})

export const beanImageWrapper = style({
	aspectRatio: '4 / 3',
	overflow: 'hidden',
	width: '100%',
})

export const beanImage = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const beanContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[2],
	padding: vars.space[6],
})

export const beanName = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	lineHeight: vars.lineHeight.tight,
})

export const beanOrigin = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
})

export const beanExcerpt = style({
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: 2,
	color: vars.color.text,
	display: '-webkit-box',
	fontSize: vars.fontSize.sm,
	lineHeight: vars.lineHeight.relaxed,
	overflow: 'hidden',
})

export const beanMeta = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[3],
	marginTop: vars.space[2],
})

export const beanDetail = style({
	backgroundColor: vars.color.background,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.full,
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	padding: `${vars.space[1]} ${vars.space[3]}`,
})

export const emptyState = style({
	backgroundColor: vars.color.secondary,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius['2xl'],
	padding: vars.space[12],
	textAlign: 'center',
})

export const emptyTitle = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[4],
})

export const emptyMessage = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
	margin: '0 auto',
	maxWidth: '500px',
})
