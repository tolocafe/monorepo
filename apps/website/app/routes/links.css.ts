import { style } from '@vanilla-extract/css'

import { vars } from '@/styles/tokens.css'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space.xl} ${vars.space.xl}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '500px',
})

export const header = style({
	marginBottom: vars.space.xl,
	textAlign: 'center',
})

export const logo = style({
	borderRadius: vars.radius.full,
	height: '80px',
	marginBottom: vars.space.md,
	objectFit: 'cover',
	width: '80px',
})

export const heading = style({
	marginBottom: vars.space.sm,
})

export const subtitle = style({
	opacity: 0.8,
})

export const linksContainer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const linkCard = style({
	alignItems: 'center',
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.lg,
	color: vars.color.text,
	display: 'flex',
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.medium,
	gap: vars.space.md,
	justifyContent: 'center',
	padding: `${vars.space.md} ${vars.space.xl}`,
	textDecoration: 'none',
})

export const linkIcon = style({
	flexShrink: 0,
	fontSize: vars.fontSize.xl,
})

export const sectionTitle = style({
	fontSize: vars.fontSize.sm,
	letterSpacing: '0.05em',
	marginBottom: vars.space.sm,
	marginTop: vars.space.xl,
	opacity: 0.6,
	textAlign: 'center',
	textTransform: 'uppercase',
})

export const appLinksGrid = style({
	display: 'grid',
	gap: vars.space.md,
	gridTemplateColumns: 'repeat(2, 1fr)',
})
