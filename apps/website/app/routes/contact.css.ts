import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space.xl} ${vars.space.xl}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

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

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const comingSoonCard = style({
	backgroundColor: vars.color.secondary,
	borderRadius: vars.radius.lg,
	padding: vars.space.xl,
	textAlign: 'center',
})

export const badge = style({
	backgroundColor: vars.color.primary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	display: 'inline-block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space.md,
	padding: `${vars.space.sm} ${vars.space.md}`,
})

export const message = style({
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
	margin: '0 auto',
	maxWidth: '600px',
})

export const infoGrid = style({
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
})

export const infoCard = style({
	backgroundColor: vars.color.background,
	borderRadius: vars.radius.lg,
	padding: vars.space.xl,
	textAlign: 'center',
})

export const infoTitle = style({
	color: vars.color.primary,
	marginBottom: vars.space.sm,
})

export const infoText = style({
	lineHeight: vars.lineHeight.relaxed,
	whiteSpace: 'pre-line',
})
