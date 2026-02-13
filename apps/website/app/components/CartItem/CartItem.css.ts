import { style } from '@vanilla-extract/css'

import {
	quantityControls as sharedQuantityControls,
	quantityButtonSmall,
	quantityValueSmall,
} from '@/styles/global.css'
import { vars } from '@/styles/tokens.css'

export const cartItem = style({
	'@media': {
		'(min-width: 480px)': {
			flexDirection: 'row',
		},
	},
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.lg,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
	padding: vars.space.md,
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
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	lineHeight: vars.lineHeight.tight,
})

export const itemVariant = style({
	fontSize: vars.fontSize.sm,
	opacity: 0.7,
})

export const itemPrice = style({
	fontWeight: vars.fontWeight.medium,
})

export const itemActions = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.md,
	justifyContent: 'space-between',
})

export const quantityControls = sharedQuantityControls

export const quantityButton = quantityButtonSmall

export const quantityValue = quantityValueSmall

export const removeButton = style({
	backgroundColor: 'transparent',
	border: 'none',
	color: vars.color.text,
	cursor: 'pointer',
	fontSize: vars.fontSize.sm,
	opacity: 0.7,
	padding: vars.space.sm,
	textDecoration: 'underline',
})
