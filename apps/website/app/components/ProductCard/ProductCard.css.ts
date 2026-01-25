import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const card = style({
	':hover': {
		borderColor: vars.color.primary,
	},
	backgroundColor: vars.color.surface,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius['2xl'],
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	transition: 'border-color 0.2s ease',
})

export const imageWrapper = style({
	aspectRatio: '1',
	backgroundColor: vars.color.background,
	overflow: 'hidden',
	position: 'relative',
	width: '100%',
})

export const image = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const imagePlaceholder = style({
	alignItems: 'center',
	backgroundColor: vars.color.border,
	display: 'flex',
	height: '100%',
	justifyContent: 'center',
	width: '100%',
})

export const soldOutBadge = style({
	backgroundColor: vars.color.text,
	borderRadius: vars.radius.md,
	color: vars.color.background,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.semibold,
	padding: `${vars.space.xs} ${vars.space.sm}`,
	position: 'absolute',
	right: vars.space.md,
	textTransform: 'uppercase',
	top: vars.space.md,
})

export const productBadge = style({
	backgroundColor: vars.color.secondary,
	borderRadius: vars.radius.md,
	color: vars.color.white,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.semibold,
	padding: `${vars.space.xs} ${vars.space.sm}`,
	position: 'absolute',
	right: vars.space.md,
	textTransform: 'uppercase',
	top: vars.space.md,
})

export const content = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: vars.space.sm,
	padding: vars.space.base,
})

export const title = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.semibold,
	lineHeight: vars.lineHeight.tight,
})

export const excerpt = style({
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: 2,
	color: vars.color.text,
	display: '-webkit-box',
	fontSize: vars.fontSize.sm,
	lineHeight: vars.lineHeight.relaxed,
	opacity: 0.8,
	overflow: 'hidden',
})

export const priceWrapper = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.sm,
	marginTop: 'auto',
})

export const price = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
})

export const comparePrice = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	opacity: 0.6,
	textDecoration: 'line-through',
})

export const productType = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xs,
	opacity: 0.6,
	textTransform: 'uppercase',
})
