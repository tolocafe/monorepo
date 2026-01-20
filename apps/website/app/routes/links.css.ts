import { style } from '@vanilla-extract/css'

import { vars } from '~/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space[12]} ${vars.space[6]}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '500px',
})

export const header = style({
	marginBottom: vars.space[8],
	textAlign: 'center',
})

export const logo = style({
	borderRadius: vars.radius.full,
	height: '80px',
	marginBottom: vars.space[4],
	objectFit: 'cover',
	width: '80px',
})

export const heading = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[2],
})

export const subtitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	opacity: 0.8,
})

export const linksContainer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[4],
})

export const linkCard = style({
	':hover': {
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
		transform: 'translateY(-2px)',
	},
	alignItems: 'center',
	backgroundColor: vars.color.surface,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.xl,
	color: vars.color.text,
	display: 'flex',
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.medium,
	gap: vars.space[3],
	justifyContent: 'center',
	padding: `${vars.space[4]} ${vars.space[6]}`,
	textDecoration: 'none',
	transition: 'transform 0.2s ease, box-shadow 0.2s ease',
})

export const linkIcon = style({
	flexShrink: 0,
	fontSize: vars.fontSize['2xl'],
})

export const sectionTitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	letterSpacing: '0.05em',
	marginBottom: vars.space[2],
	marginTop: vars.space[6],
	opacity: 0.6,
	textAlign: 'center',
	textTransform: 'uppercase',
})

export const appLinksGrid = style({
	display: 'grid',
	gap: vars.space[4],
	gridTemplateColumns: 'repeat(2, 1fr)',
})
