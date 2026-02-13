import { style } from '@vanilla-extract/css'

import { card, section } from '@/styles/global.css'
import { vars } from '@/styles/tokens.css'

// Hero
export const hero = style([
	section,
	{
		alignItems: 'center',
		backgroundColor: vars.color.primary,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		minHeight: '50vh',
		textAlign: 'center',
	},
])

export const heroInner = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const heroTitle = style({
	color: vars.color.white,
	fontSize: 'clamp(2rem, 6vw, 3.5rem)',
	letterSpacing: '-0.02em',
	marginBottom: vars.space.md,
	textTransform: 'none',
})

export const heroSubtitle = style({
	color: 'rgba(255, 255, 255, 0.9)',
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space.xl,
})

export const heroButton = style({
	backgroundColor: vars.color.white,
	borderRadius: vars.radius.lg,
	color: vars.color.primary,
	fontSize: vars.fontSize.lg,
	padding: `${vars.space.md} ${vars.space.xl}`,
})

// Value section (Why TOLO)
export const valueSection = style([
	section,
	{
		margin: '0 auto',
		maxWidth: '1100px',
	},
])

export const valueGrid = style({
	'@media': {
		'(min-width: 900px)': {
			gridTemplateColumns: '1fr 1fr',
		},
	},
	alignItems: 'center',
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: '1fr',
})

export const valueText = style({
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space.xl,
})

export const benefitsList = style({
	display: 'grid',
	gap: vars.space.md,
	listStyle: 'none',
	margin: 0,
	padding: 0,
})

export const benefitItem = style({
	alignItems: 'flex-start',
	display: 'flex',
	gap: vars.space.md,
	lineHeight: vars.lineHeight.relaxed,
	selectors: {
		'&::before': {
			color: vars.color.secondary,
			content: '"•"',
			fontWeight: vars.fontWeight.bold,
			lineHeight: vars.lineHeight.none,
		},
	},
})

export const valueImage = style({
	'@media': {
		'(min-width: 768px)': {
			aspectRatio: '1 / 1',
		},
	},
	aspectRatio: '4 / 3',
	borderRadius: vars.radius.lg,
	objectFit: 'cover',
	width: '100%',
})

// Origins grid
export const originsSection = style([
	section,
	{
		backgroundColor: vars.color.surface,
	},
])

export const originsInner = style({
	margin: '0 auto',
	maxWidth: '1100px',
})

export const sectionTitle = style({
	marginBottom: vars.space.md,
})

export const sectionSubtitle = style({
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space.xl,
})

export const originsGrid = style({
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
})

export const originCard = style([
	card,
	{
		textAlign: 'center',
	},
])

export const originName = style({
	fontSize: vars.fontSize.xl,
	marginBottom: vars.space.sm,
})

export const originDetail = style({
	lineHeight: vars.lineHeight.relaxed,
})

// Process steps
export const processSection = style([
	section,
	{
		margin: '0 auto',
		maxWidth: '1100px',
	},
])

export const stepsGrid = style({
	'@media': {
		'(min-width: 768px)': {
			gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
})

export const stepCard = style([
	card,
	{
		textAlign: 'center',
	},
])

export const stepNumber = style({
	alignItems: 'center',
	backgroundColor: vars.color.primary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	display: 'flex',
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	height: '48px',
	justifyContent: 'center',
	margin: '0 auto',
	marginBottom: vars.space.md,
	width: '48px',
})

export const stepTitle = style({
	marginBottom: vars.space.sm,
})

export const stepText = style({
	lineHeight: vars.lineHeight.relaxed,
})

// Trust bar
export const trustSection = style([
	section,
	{
		backgroundColor: vars.color.surface,
	},
])

export const trustInner = style({
	margin: '0 auto',
	maxWidth: '1100px',
})

export const trustGrid = style({
	'@media': {
		'(min-width: 768px)': {
			gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
	textAlign: 'center',
})

export const trustValue = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	lineHeight: vars.lineHeight.none,
	marginBottom: vars.space.sm,
})

export const trustLabel = style({
	lineHeight: vars.lineHeight.relaxed,
})

// CTA section
export const cta = style([
	section,
	{
		backgroundColor: vars.color.primary,
		textAlign: 'center',
	},
])

export const ctaInner = style({
	margin: '0 auto',
	maxWidth: '700px',
})

export const ctaTitle = style({
	color: vars.color.white,
	fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
	marginBottom: vars.space.md,
	textTransform: 'none',
})

export const ctaText = style({
	color: 'rgba(255, 255, 255, 0.9)',
	fontSize: vars.fontSize.xl,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space.xl,
})

export const ctaButton = style({
	backgroundColor: vars.color.white,
	borderRadius: vars.radius.lg,
	color: vars.color.primary,
	fontSize: vars.fontSize.lg,
	padding: `${vars.space.md} ${vars.space.xl}`,
})
