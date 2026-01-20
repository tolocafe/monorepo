import { style } from '@vanilla-extract/css'

import { vars } from '~/styles'

export const header = style({
	backgroundColor: vars.color.primary,
	borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
	position: 'sticky',
	top: 0,
	zIndex: 50,
})

export const inner = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space[4],
	justifyContent: 'space-between',
	margin: '0 auto',
	maxWidth: '1200px',
	padding: `${vars.space[3]} ${vars.space[6]}`,
})

export const left = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space[6],
	minWidth: 0,
})

export const nav = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space[4],
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
	gap: vars.space[2],
})

export const link = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	':hover': {
		backgroundColor: 'rgba(255, 255, 255, 0.12)',
		color: vars.color.white,
	},
	alignItems: 'center',
	borderRadius: vars.radius.full,
	color: 'rgba(255, 255, 255, 0.92)',
	display: 'inline-flex',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	justifyContent: 'center',
	padding: `${vars.space[2]} ${vars.space[3]}`,
	textDecoration: 'none',
})

export const linkActive = style({
	backgroundColor: 'rgba(255, 255, 255, 0.16)',
	color: vars.color.white,
})

export const cta = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	':hover': {
		filter: 'brightness(1.05)',
	},
	'@media': {
		'(min-width: 768px)': {
			display: 'inline-flex',
		},
	},
	alignItems: 'center',
	backgroundColor: vars.color.secondary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	display: 'none',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	justifyContent: 'center',
	padding: `${vars.space[2]} ${vars.space[4]}`,
	textDecoration: 'none',
})

export const right = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space[3],
})

export const localeNav = style({
	alignItems: 'center',
	display: 'flex',
})

export const localeSelect = style({
	':focus': {
		outline: `2px solid ${vars.color.background}`,
		outlineOffset: '2px',
	},
	appearance: 'none',
	backgroundColor: vars.color.background,
	backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233D6039' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
	backgroundPosition: `right ${vars.space[2]} center`,
	backgroundRepeat: 'no-repeat',
	border: 'none',
	borderRadius: vars.radius.md,
	color: vars.color.primary,
	cursor: 'pointer',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	padding: `${vars.space[2]} ${vars.space[4]}`,
	paddingRight: vars.space[8],
})

export const menuButton = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	':hover': {
		backgroundColor: 'rgba(255, 255, 255, 0.12)',
	},
	'@media': {
		'(min-width: 768px)': {
			display: 'none',
		},
	},
	alignItems: 'center',
	backgroundColor: 'transparent',
	border: '1px solid rgba(255, 255, 255, 0.25)',
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
	gap: vars.space[6],
	height: '100%',
	padding: vars.space[6],
	position: 'fixed',
	right: 0,
	top: 0,
	width: 'min(380px, 92vw)',
	zIndex: 61,
})

export const mobileHeader = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space[4],
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
	':hover': {
		backgroundColor: 'rgba(255, 255, 255, 0.12)',
	},
	backgroundColor: 'transparent',
	border: '1px solid rgba(255, 255, 255, 0.25)',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	cursor: 'pointer',
	height: '40px',
	width: '40px',
})

export const mobileLinks = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[2],
})

export const mobileLink = style([
	link,
	{
		fontSize: vars.fontSize.lg,
		justifyContent: 'flex-start',
		padding: `${vars.space[3]} ${vars.space[4]}`,
	},
])

export const mobileCta = style([
	cta,
	{
		display: 'inline-flex',
		fontSize: vars.fontSize.base,
		justifyContent: 'center',
		padding: `${vars.space[3]} ${vars.space[4]}`,
		width: '100%',
	},
])
