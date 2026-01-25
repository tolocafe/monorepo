import { style } from '@vanilla-extract/css'

import {
	vars,
	containerWide,
	pageMain,
	emptyStateCard,
	emptyTitle as sharedEmptyTitle,
	emptyMessage as sharedEmptyMessage,
} from '@/styles'

export const main = pageMain

export const container = containerWide

export const header = style({
	marginBottom: vars.space['4xl'],
	textAlign: 'center',
})

export const heading = style({
	fontSize: vars.fontSize['4xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space.base,
})

export const subtitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
})

export const productsGrid = style({
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
