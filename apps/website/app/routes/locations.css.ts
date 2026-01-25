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
	gap: vars.space['4xl'],
})

export const locationsGrid = style({
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
})

export const locationCard = style({
	':hover': {
		borderColor: vars.color.primary,
	},
	backgroundColor: vars.color.background,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius['2xl'],
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	textDecoration: 'none',
	transition: 'border-color 0.2s ease',
})

export const locationImageWrapper = style({
	aspectRatio: '3 / 2',
	overflow: 'hidden',
	width: '100%',
})

export const locationImage = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const locationContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.sm,
	padding: vars.space.xl,
})

export const locationHeader = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.sm,
})

export const locationName = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	lineHeight: vars.lineHeight.tight,
})

export const mainBadge = style({
	backgroundColor: vars.color.primary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.semibold,
	padding: `${vars.space.xs} ${vars.space.sm}`,
	textTransform: 'uppercase',
})

export const locationCity = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
})

export const locationAddress = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	lineHeight: vars.lineHeight.relaxed,
})

export const locationHours = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	marginTop: vars.space.xs,
})

export const hoursLabel = style({
	fontWeight: vars.fontWeight.medium,
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
