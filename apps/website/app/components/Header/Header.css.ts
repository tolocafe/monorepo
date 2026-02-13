import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const header = style({
	backdropFilter: 'blur(12px)',
	backgroundColor: vars.color.primary,
	position: 'sticky',
	top: 0,
	zIndex: 50,
})

export const inner = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.md,
	justifyContent: 'space-between',
	margin: '0 auto',
	maxWidth: '1200px',
	padding: `${vars.space.md} ${vars.space.xl}`,
})

export const left = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.xl,
	minWidth: 0,
})

export const nav = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.md,
})

export const logo = style({
	alignItems: 'center',
	display: 'flex',
	textDecoration: 'none',
})

export const logoImg = style({
	height: '40px',
	width: 'auto',
})

export const links = style({
	'@media': {
		'(min-width: 768px)': {
			display: 'flex',
		},
	},
	alignItems: 'center',
	display: 'none',
	gap: vars.space.sm,
})

export const link = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	alignItems: 'center',
	borderRadius: vars.radius.full,
	color: 'rgba(255, 255, 255, 0.92)',
	display: 'inline-flex',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	justifyContent: 'center',
	letterSpacing: '0.05em',
	padding: `${vars.space.sm} ${vars.space.md}`,
	textDecoration: 'none',
	textTransform: 'uppercase',
})

export const linkActive = style({
	backgroundColor: 'rgba(255, 255, 255, 0.16)',
	color: vars.color.white,
})

export const right = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.md,
})

export const headerCta = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	'@media': {
		'(max-width: 767px)': {
			display: 'none',
		},
	},
	backgroundColor: vars.color.secondary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	letterSpacing: '0.05em',
	padding: `${vars.space.sm} ${vars.space.lg}`,
	textDecoration: 'none',
	textTransform: 'uppercase',
})

export const localeNav = style({
	alignItems: 'center',
	display: 'flex',
	position: 'relative',
})

export const localeButton = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	alignItems: 'center',
	backgroundColor: 'transparent',
	border: 'none',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	cursor: 'pointer',
	display: 'flex',
	height: '40px',
	justifyContent: 'center',
	width: '40px',
})

export const localeDropdown = style({
	backgroundColor: vars.color.white,
	borderRadius: vars.radius.md,
	boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
	display: 'flex',
	flexDirection: 'column',
	minWidth: '140px',
	overflow: 'hidden',
	position: 'absolute',
	right: 0,
	top: 'calc(100% + 8px)',
	zIndex: 100,
})

export const localeOption = style({
	backgroundColor: 'transparent',
	border: 'none',
	color: vars.color.text,
	cursor: 'pointer',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	padding: `${vars.space.md} ${vars.space.md}`,
	textAlign: 'left',
})

export const localeOptionActive = style({
	backgroundColor: vars.color.background,
	color: vars.color.primary,
	fontWeight: vars.fontWeight.semibold,
})

export const menuButton = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	'@media': {
		'(min-width: 768px)': {
			display: 'none',
		},
	},
	alignItems: 'center',
	backgroundColor: 'transparent',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	cursor: 'pointer',
	display: 'inline-flex',
	height: '40px',
	justifyContent: 'center',
	width: '40px',
})

export const mobileOverlay = style({
	backgroundColor: 'rgba(0, 0, 0, 0.55)',
	inset: 0,
	position: 'fixed',
	zIndex: 60,
})

export const mobilePanel = style({
	backgroundColor: vars.color.primary,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
	height: '100%',
	padding: vars.space.xl,
	position: 'fixed',
	right: 0,
	top: 0,
	width: 'min(380px, 92vw)',
	zIndex: 61,
})

export const mobileHeader = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.md,
	justifyContent: 'space-between',
})

export const mobileTitle = style({
	color: vars.color.white,
	fontWeight: vars.fontWeight.bold,
	letterSpacing: '0.06em',
})

export const mobileClose = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	backgroundColor: 'transparent',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	cursor: 'pointer',
	height: '40px',
	width: '40px',
})

export const mobileLinks = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.sm,
})

export const mobileLink = style([
	link,
	{
		fontSize: vars.fontSize.lg,
		justifyContent: 'flex-start',
		padding: `${vars.space.md} ${vars.space.md}`,
	},
])
