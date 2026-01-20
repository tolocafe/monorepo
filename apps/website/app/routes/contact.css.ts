import { style } from '@vanilla-extract/css'

import { vars } from '~/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space[12]} ${vars.space[6]}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const header = style({
	marginBottom: vars.space[12],
	textAlign: 'center',
})

export const heading = style({
	fontSize: vars.fontSize['4xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[4],
})

export const subtitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
})

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[8],
})

export const comingSoonCard = style({
	backgroundColor: vars.color.secondary,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius['2xl'],
	padding: vars.space[8],
	textAlign: 'center',
})

export const badge = style({
	backgroundColor: '#c45a32',
	borderRadius: vars.radius.full,
	color: '#ffffff',
	display: 'inline-block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[4],
	padding: `${vars.space[2]} ${vars.space[4]}`,
})

export const message = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
	margin: '0 auto',
	maxWidth: '600px',
})

export const infoGrid = style({
	display: 'grid',
	gap: vars.space[6],
	gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
})

export const infoCard = style({
	backgroundColor: vars.color.background,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.xl,
	padding: vars.space[6],
	textAlign: 'center',
})

export const infoTitle = style({
	color: '#c45a32',
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[2],
})

export const infoText = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	lineHeight: vars.lineHeight.relaxed,
	whiteSpace: 'pre-line',
})
