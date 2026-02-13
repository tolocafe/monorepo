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
	marginBottom: vars.space.xl,
	textAlign: 'center',
})

export const heading = style({
	marginBottom: vars.space.md,
})

export const subtitle = style({
	fontSize: vars.fontSize.lg,
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
