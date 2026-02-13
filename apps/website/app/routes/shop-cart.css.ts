import { style } from '@vanilla-extract/css'

import {
	vars,
	containerNarrow,
	pageMain,
	backLink as sharedBackLink,
	emptyState,
	emptyTitle as sharedEmptyTitle,
	emptyMessage as sharedEmptyMessage,
	buttonPrimary,
} from '@/styles'

export const main = pageMain

export const container = containerNarrow

export const backLink = sharedBackLink

export const header = style({
	marginBottom: vars.space.xl,
})

export const heading = style({})

export const cartContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const cartSummary = style({
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.lg,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
	marginTop: vars.space.xl,
	padding: vars.space.xl,
})

export const summaryRow = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'space-between',
})

export const summaryLabel = style({})

export const summaryValue = style({
	fontWeight: vars.fontWeight.medium,
})

export const totalRow = style([
	summaryRow,
	{
		paddingTop: vars.space.md,
	},
])

export const totalLabel = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
})

export const totalValue = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
})

export const checkoutButton = style({
	alignItems: 'center',
	backgroundColor: vars.color.secondary,
	border: 'none',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	cursor: 'pointer',
	display: 'flex',
	fontWeight: vars.fontWeight.semibold,
	justifyContent: 'center',
	marginTop: vars.space.sm,
	padding: `${vars.space.md} ${vars.space.xl}`,
	textDecoration: 'none',
	width: '100%',
})

export const continueShoppingLink = style({
	color: vars.color.primary,
	display: 'block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	marginTop: vars.space.md,
	textAlign: 'center',
	textDecoration: 'none',
})

export const emptyCart = emptyState

export const emptyTitle = sharedEmptyTitle

export const emptyMessage = style([
	sharedEmptyMessage,
	{
		marginBottom: vars.space.xl,
	},
])

export const shopNowButton = buttonPrimary

export const loading = style({
	padding: vars.space.xl,
	textAlign: 'center',
})
