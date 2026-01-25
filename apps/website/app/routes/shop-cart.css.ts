import { style } from '@vanilla-extract/css'

import {
	vars,
	containerNarrow,
	pageMain,
	backLink as sharedBackLink,
	quantityControls as sharedQuantityControls,
	quantityButtonSmall,
	quantityValueSmall,
	emptyState,
	emptyTitle as sharedEmptyTitle,
	emptyMessage as sharedEmptyMessage,
	buttonPrimary,
} from '@/styles'

export const main = pageMain

export const container = containerNarrow

export const backLink = sharedBackLink

export const header = style({
	marginBottom: vars.space['2xl'],
})

export const heading = style({
	fontSize: vars.fontSize['3xl'],
	fontWeight: vars.fontWeight.bold,
})

export const cartContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const cartItem = style({
	'@media': {
		'(min-width: 480px)': {
			flexDirection: 'row',
		},
	},
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius['2xl'],
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.base,
	padding: vars.space.base,
})

export const itemImage = style({
	'@media': {
		'(min-width: 480px)': {
			height: '120px',
			width: '120px',
		},
	},
	backgroundColor: vars.color.background,
	borderRadius: vars.radius.lg,
	height: '100px',
	objectFit: 'cover',
	width: '100px',
})

export const itemDetails = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: vars.space.sm,
	justifyContent: 'center',
})

export const itemTitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	lineHeight: vars.lineHeight.tight,
})

export const itemVariant = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	opacity: 0.7,
})

export const itemPrice = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
})

export const itemActions = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.base,
	justifyContent: 'space-between',
})

export const quantityControls = sharedQuantityControls

export const quantityButton = quantityButtonSmall

export const quantityValue = quantityValueSmall

export const removeButton = style({
	':hover': {
		color: vars.color.secondary,
	},
	backgroundColor: 'transparent',
	border: 'none',
	color: vars.color.text,
	cursor: 'pointer',
	fontSize: vars.fontSize.sm,
	opacity: 0.7,
	padding: vars.space.sm,
	textDecoration: 'underline',
})

export const cartSummary = style({
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius['2xl'],
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.base,
	marginTop: vars.space.xl,
	padding: vars.space.xl,
})

export const summaryRow = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'space-between',
})

export const summaryLabel = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
})

export const summaryValue = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
})

export const totalRow = style([
	summaryRow,
	{
		borderTop: `1px solid ${vars.color.border}`,
		paddingTop: vars.space.base,
	},
])

export const totalLabel = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
})

export const totalValue = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
})

export const checkoutButton = style({
	':hover': {
		filter: 'brightness(1.05)',
	},
	alignItems: 'center',
	backgroundColor: vars.color.secondary,
	border: 'none',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	cursor: 'pointer',
	display: 'flex',
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.semibold,
	justifyContent: 'center',
	marginTop: vars.space.sm,
	padding: `${vars.space.base} ${vars.space.xl}`,
	textDecoration: 'none',
	width: '100%',
})

export const continueShoppingLink = style({
	':hover': {
		color: vars.color.secondary,
	},
	color: vars.color.primary,
	display: 'block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	marginTop: vars.space.base,
	textAlign: 'center',
	textDecoration: 'none',
})

export const emptyCart = emptyState

export const emptyTitle = sharedEmptyTitle

export const emptyMessage = style([
	sharedEmptyMessage,
	{
		marginBottom: vars.space['2xl'],
	},
])

export const shopNowButton = buttonPrimary

export const loading = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	padding: vars.space['4xl'],
	textAlign: 'center',
})
