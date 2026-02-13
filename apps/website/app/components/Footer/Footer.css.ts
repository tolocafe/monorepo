import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const footer = style({
	backgroundColor: vars.color.primary,
	borderTop: 'none',
	marginTop: 'auto',
	padding: `${vars.space['4xl']} ${vars.space.xl} ${vars.space.xl}`,
})

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space['4xl'],
	margin: '0 auto',
	maxWidth: '1200px',
})

export const brandSection = style({
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
	gap: vars.space['2xl'],
	gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
})

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const sectionTitle = style({
	color: vars.color.white,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space.sm,
})

export const link = style({
	':hover': {
		color: vars.color.white,
	},
	color: 'rgba(255, 255, 255, 0.7)',
	fontSize: vars.fontSize.base,
	textDecoration: 'none',
})

export const bottomBar = style({
	'@media': {
		'(max-width: 640px)': {
			alignItems: 'flex-start',
			flexDirection: 'column',
		},
	},
	alignItems: 'center',
	borderTop: `1px solid rgba(255, 255, 255, 0.2)`,
	display: 'flex',
	flexDirection: 'row',
	gap: vars.space.base,
	justifyContent: 'space-between',
	margin: '0 auto',
	marginTop: vars.space['2xl'],
	maxWidth: '1200px',
	paddingTop: vars.space.xl,
})

export const copyright = style({
	color: 'rgba(255, 255, 255, 0.7)',
	fontSize: vars.fontSize.sm,
	margin: 0,
})

export const legalLink = style({
	':hover': {
		color: vars.color.white,
	},
	color: 'rgba(255, 255, 255, 0.7)',
	fontSize: vars.fontSize.sm,
	marginLeft: vars.space.base,
	textDecoration: 'none',
})

export const paymentIcons = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.sm,
	opacity: 0.7,
})

export const socialLinks = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.base,
})

export const socialLink = style({
	':hover': {
		color: vars.color.white,
	},
	alignItems: 'center',
	color: 'rgba(255, 255, 255, 0.7)',
	display: 'flex',
	transition: 'color 0.2s',
})

export const storeLinks = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const storeLink = style({
	':hover': {
		opacity: 1,
	},
	display: 'block',
	opacity: 0.85,
	transition: 'opacity 0.2s',
})

export const storeBadge = style({
	display: 'block',
	height: 40,
	width: 'auto',
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
