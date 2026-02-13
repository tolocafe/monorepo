import { style } from '@vanilla-extract/css'

import { vars } from '@/styles/tokens.css'

export const footer = style({
	backgroundColor: vars.color.primary,
	marginTop: 'auto',
})

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
	margin: '0 auto',
	maxWidth: '1200px',
	padding: `${vars.space.xl} ${vars.space.xl} ${vars.space.xl}`,
})

export const brandSection = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.sm,
	maxWidth: '400px',
})

export const linksGrid = style({
	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
})

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const sectionTitle = style({
	color: vars.color.white,
	marginBottom: vars.space.sm,
})

export const link = style({
	color: 'rgba(255, 255, 255, 0.7)',
	textDecoration: 'none',
})

export const bottomBar = style({
	'@media': {
		'(max-width: 640px)': {
			flexDirection: 'column',
		},
	},
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: vars.space.lg,
	justifyContent: 'space-between',
	margin: `${vars.space.xl} auto`,
	maxWidth: '1200px',
	paddingTop: vars.space.xl,
})

export const copyright = style({
	color: 'rgba(255, 255, 255, 0.7)',
	fontSize: vars.fontSize.sm,
	margin: 0,
})

export const legalLink = style({
	color: 'rgba(255, 255, 255, 0.7)',
	fontSize: vars.fontSize.sm,
	marginLeft: vars.space.md,
	textDecoration: 'none',
})

export const paymentIcons = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.sm,
})

export const socialLinks = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.md,
})

export const socialLink = style({
	alignItems: 'center',
	color: 'rgba(255, 255, 255, 0.7)',
	display: 'flex',
})

export const storeLinks = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const storeLink = style({
	display: 'block',
})

export const storeBadge = style({
	display: 'block',
	height: 'auto',
	width: '150px',
})

export const brand = style({
	height: 32,
	marginBottom: vars.space.sm,
	width: 'auto',
})

export const tagline = style({
	color: 'rgba(255, 255, 255, 0.7)',
	fontSize: vars.fontSize.sm,
	lineHeight: vars.lineHeight.relaxed,
})
