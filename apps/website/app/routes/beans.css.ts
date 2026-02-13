import { style } from '@vanilla-extract/css'

import {
	vars,
	containerWide,
	pageMain,
	pageHeader,
	pageHeading,
	pageSubtitle,
	emptyStateCard,
	emptyTitle as sharedEmptyTitle,
	emptyMessage as sharedEmptyMessage,
} from '@/styles'

export const main = pageMain

export const container = containerWide

export const header = pageHeader

export const heading = pageHeading

export const subtitle = pageSubtitle

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const beansGrid = style({
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
})

export const beanCard = style({
	backgroundColor: vars.color.background,
	borderRadius: vars.radius.lg,
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
	gap: vars.space.sm,
	padding: vars.space.xl,
})

export const beanName = style({
	color: vars.color.text,
})

export const beanOrigin = style({
	color: vars.color.secondary,
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
	gap: vars.space.md,
	marginTop: vars.space.sm,
})

export const beanDetail = style({
	backgroundColor: vars.color.background,
	borderRadius: vars.radius.full,
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	padding: `${vars.space.xs} ${vars.space.md}`,
})

export const emptyState = emptyStateCard

export const emptyTitle = sharedEmptyTitle

export const emptyMessage = style([
	sharedEmptyMessage,
	{
		margin: '0 auto',
		maxWidth: '500px',
	},
])
