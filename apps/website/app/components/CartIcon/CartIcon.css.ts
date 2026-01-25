import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const cartLink = style({
	':focus-visible': {
		outline: `2px solid ${vars.color.white}`,
		outlineOffset: '2px',
	},
	':hover': {
		backgroundColor: 'rgba(255, 255, 255, 0.12)',
	},
	alignItems: 'center',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	display: 'inline-flex',
	height: '40px',
	justifyContent: 'center',
	position: 'relative',
	textDecoration: 'none',
	width: '40px',
})

export const badge = style({
	alignItems: 'center',
	backgroundColor: vars.color.secondary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	display: 'flex',
	fontSize: '10px',
	fontWeight: vars.fontWeight.bold,
	height: '18px',
	justifyContent: 'center',
	minWidth: '18px',
	padding: '0 4px',
	position: 'absolute',
	right: '-2px',
	top: '-2px',
})
