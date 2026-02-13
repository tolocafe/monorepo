import { style } from '@vanilla-extract/css'

import {
	containerWide,
	pageMain,
	pageHeader,
	pageHeading,
	emptyStateCard,
	emptyTitle as sharedEmptyTitle,
	emptyMessage as sharedEmptyMessage,
} from '@/styles/global.css'
import { vars } from '@/styles/tokens.css'

export const main = pageMain

export const container = containerWide

export const header = pageHeader

export const heading = pageHeading

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const locationsGrid = style({
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
})

export const locationCard = style({
	backgroundColor: vars.color.background,
	borderRadius: vars.radius.lg,
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	textDecoration: 'none',
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
})

export const mainBadge = style({
	backgroundColor: vars.color.primary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	padding: `${vars.space.xs} ${vars.space.sm}`,
	textTransform: 'uppercase',
})

export const upcomingBadge = style({
	backgroundColor: vars.color.secondary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	padding: `${vars.space.xs} ${vars.space.sm}`,
	textTransform: 'uppercase',
})

export const locationCity = style({
	color: vars.color.secondary,
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
