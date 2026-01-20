import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const footer = style({
	backgroundColor: vars.color.primary,
	borderTop: 'none',
	marginTop: 'auto',
	padding: `${vars.space[12]} ${vars.space[6]} ${vars.space[6]}`,
})

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[12],
	margin: '0 auto',
	maxWidth: '1200px',
})

export const brandSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[2],
	maxWidth: '400px',
})

export const linksGrid = style({
	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
	display: 'grid',
	gap: vars.space[8],
	gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
})

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[3],
})

export const sectionTitle = style({
	color: vars.color.white,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[2],
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
	gap: vars.space[4],
	justifyContent: 'space-between',
	margin: '0 auto',
	marginTop: vars.space[8],
	maxWidth: '1200px',
	paddingTop: vars.space[6],
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
	marginLeft: vars.space[4],
	textDecoration: 'none',
})

export const socialLinks = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space[4],
})

export const socialLink = style({
	':hover': {
		color: vars.color.white,
		opacity: 1,
	},
	color: 'rgba(255, 255, 255, 0.7)',
	display: 'block',
	opacity: 0.7,
	transition: 'opacity 0.2s',
})

export const socialIcon = style({
	color: vars.color.white,
	display: 'block',
	height: 28,
	width: 28,
})

export const storeLinks = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[3],
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
	color: vars.color.white,
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[2],
})

export const tagline = style({
	color: 'rgba(255, 255, 255, 0.7)',
	fontSize: vars.fontSize.sm,
	lineHeight: vars.lineHeight.relaxed,
})
