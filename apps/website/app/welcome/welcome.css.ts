import { style } from '@vanilla-extract/css'

import {
	buttonBase,
	buttonSecondary,
	buttonLight,
	buttonGhost,
	card,
	imagePlaceholder,
	section,
	container,
} from '@/styles/global.css'
import { vars } from '@/styles/tokens.css'

/**
 * Welcome component styles
 *
 * Specific styles for the homepage that extend global patterns.
 */

export const main = style({
	display: 'flex',
	flexDirection: 'column',
	minHeight: '100vh',
})

// Hero Section
export const hero = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	minHeight: '70vh',
	overflow: 'hidden',
	position: 'relative',
})

export const heroVideo = style({
	height: '100%',
	inset: 0,
	position: 'absolute',
	width: '100%',
})

export const heroVideoIframe = style({
	border: 'none',
	height: '100vh',
	left: '50%',
	minHeight: '56.25vw',
	minWidth: '100%',
	pointerEvents: 'none',
	position: 'absolute',
	top: '50%',
	transform: 'translate(-50%, -50%)',
	width: '177.78vh',
})

export const heroOverlay = style({
	background:
		'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0.75) 100%)',
	inset: 0,
	position: 'absolute',
})

export const heroContent = style({
	'@media': {
		'(min-width: 768px)': {
			padding: `${vars.space[16]} ${vars.space[6]}`,
			textAlign: 'left',
		},
	},
	margin: '0 auto',
	maxWidth: '1100px',
	padding: `${vars.space[10]} ${vars.space[6]}`,
	position: 'relative',
	textAlign: 'center',
	zIndex: 10,
})

export const heroTitle = style({
	color: vars.color.white,
	fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
	fontWeight: vars.fontWeight.bold,
	letterSpacing: '-0.02em',
	lineHeight: vars.lineHeight.none,
	marginBottom: vars.space[4],
	textTransform: 'none',
})

export const heroSubtitle = style({
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.lg,
		},
	},
	color: 'rgba(255, 255, 255, 0.9)',
	fontSize: vars.fontSize.xl,
	lineHeight: vars.lineHeight.relaxed,
	margin: 0,
	maxWidth: '600px',
})

export const heroActions = style({
	'@media': {
		'(min-width: 768px)': {
			justifyContent: 'flex-start',
		},
	},
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[3],
	justifyContent: 'center',
	marginTop: vars.space[8],
})

export const heroPrimaryButton = style([
	buttonBase,
	{
		':hover': {
			filter: 'brightness(1.05)',
		},
		backgroundColor: vars.color.secondary,
		color: vars.color.white,
	},
])

export const heroSecondaryButton = buttonGhost
export const heroTertiaryButton = buttonLight

// Trust Bar
export const quickLinksSection = style({
	padding: `${vars.space[10]} ${vars.space[6]} ${vars.space[16]}`,
})

export const trustBar = style({
	'@media': {
		'(max-width: 640px)': {
			gap: vars.space[3],
			padding: vars.space[4],
		},
		'(min-width: 768px)': {
			gap: vars.space[6],
		},
	},
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius['2xl'],
	display: 'grid',
	gap: vars.space[4],
	gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
	marginBottom: vars.space[10],
	padding: vars.space[5],
})

export const trustItem = style({
	textAlign: 'center',
})

export const trustValue = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	lineHeight: vars.lineHeight.none,
})

export const trustLabel = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	lineHeight: vars.lineHeight.normal,
	marginTop: vars.space[2],
})

// Quick Cards
export const quickLinksGrid = style({
	'@media': {
		'(min-width: 768px)': {
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space[6],
	gridTemplateColumns: '1fr',
})

export const quickCard = style([
	card,
	{
		':focus-visible': {
			outline: `2px solid ${vars.color.primary}`,
			outlineOffset: '3px',
		},
		display: 'flex',
		flexDirection: 'column',
		padding: vars.space[5],
		textDecoration: 'none',
	},
])

export const quickCardImage = style([
	imagePlaceholder,
	{
		aspectRatio: '16 / 10',
		borderRadius: vars.radius.xl,
		marginBottom: vars.space[4],
		width: '100%',
	},
])

export const quickCardBody = style({
	minWidth: 0,
})

export const quickCardTitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[2],
})

export const quickCardText = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space[3],
})

export const quickCardCta = style({
	color: vars.color.secondary,
	display: 'inline-block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
})

// Content Sections
export const sectionAnchor = style([
	section,
	{
		scrollMarginTop: '96px',
	},
])

export const sectionContent = style({
	'@media': {
		'(max-width: 768px)': {
			textAlign: 'center',
		},
	},
	margin: '0 auto',
	maxWidth: '1100px',
	textAlign: 'left',
})

export const sectionTitle = style({
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize['2xl'],
		},
	},
	fontSize: vars.fontSize['3xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[6],
})

export const sectionText = style({
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.lg,
		},
	},
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	lineHeight: vars.lineHeight.relaxed,
})

// About Section
export const aboutGrid = style({
	'@media': {
		'(min-width: 900px)': {
			gridTemplateColumns: '1fr 1fr',
		},
	},
	alignItems: 'center',
	display: 'grid',
	gap: vars.space[10],
	gridTemplateColumns: '1fr',
})

export const aboutTextBlock = style({
	'@media': {
		'(min-width: 900px)': {
			order: 1,
		},
	},
	order: 2,
})

export const aboutImageBlock = style({
	'@media': {
		'(min-width: 900px)': {
			order: 2,
		},
	},
	order: 1,
})

export const aboutImage = style([
	imagePlaceholder,
	{
		'@media': {
			'(min-width: 768px)': {
				aspectRatio: '1 / 1',
			},
		},
		aspectRatio: '4 / 3',
		width: '100%',
	},
])

export const highlightsGrid = style({
	'@media': {
		'(min-width: 768px)': {
			gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space[6],
	gridTemplateColumns: '1fr',
	marginTop: vars.space[10],
})

export const highlightCard = card

export const highlightTitle = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[3],
})

export const highlightText = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	lineHeight: vars.lineHeight.relaxed,
})

// Menu Section
export const chipGrid = style({
	'@media': {
		'(min-width: 768px)': {
			justifyContent: 'flex-start',
		},
	},
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[3],
	justifyContent: 'center',
	marginBottom: vars.space[6],
})

export const chip = style([
	card,
	{
		color: vars.color.text,
		fontSize: vars.fontSize.sm,
		fontWeight: vars.fontWeight.medium,
		padding: `${vars.space[2]} ${vars.space[4]}`,
	},
])

// App Section
export const splitSection = style({
	'@media': {
		'(min-width: 900px)': {
			alignItems: 'center',
			flexDirection: 'row',
		},
	},
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[10],
})

export const storeButtons = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[3],
	marginTop: vars.space[6],
})

export const storeButtonPrimary = style([
	buttonBase,
	{
		':hover': {
			filter: 'brightness(1.05)',
		},
		backgroundColor: vars.color.primary,
		color: vars.color.white,
	},
])

export const storeButtonSecondary = buttonLight

export const infoCard = style({
	backgroundColor: 'rgba(255, 255, 255, 0.35)',
	borderRadius: vars.radius['2xl'],
	padding: vars.space[6],
})

export const appInfoCard = style([
	infoCard,
	{
		marginTop: vars.space[8],
	},
])

export const subTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[4],
})

export const bullets = style({
	display: 'grid',
	gap: vars.space[3],
	listStyle: 'none',
	margin: 0,
	padding: 0,
})

export const bullet = style({
	alignItems: 'flex-start',
	color: vars.color.text,
	display: 'flex',
	fontSize: vars.fontSize.base,
	gap: vars.space[3],
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

export const appImage = style([
	imagePlaceholder,
	{
		aspectRatio: '9 / 16',
		margin: '0 auto',
		maxWidth: '280px',
		width: '100%',
	},
])

export const appText = style({
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.lg,
		},
	},
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space[2],
})

// Visit Section
export const visitGrid = style({
	'@media': {
		'(min-width: 900px)': {
			gridTemplateColumns: '0.9fr 1.1fr',
		},
	},
	alignItems: 'start',
	display: 'grid',
	gap: vars.space[10],
	gridTemplateColumns: '1fr',
})

export const visitCard = style({
	backgroundColor: vars.color.background,
})

export const visitImage = style([
	imagePlaceholder,
	{
		aspectRatio: '21 / 9',
		marginBottom: vars.space[8],
		width: '100%',
	},
])

export const addressCard = style([
	card,
	{
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space[4],
		marginTop: vars.space[6],
	},
])

export const address = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	lineHeight: vars.lineHeight.relaxed,
})

export const directionsLink = buttonSecondary

export const mapWrapper = style({
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius['2xl'],
	minHeight: '360px',
	overflow: 'hidden',
})

export const map = style({
	border: 'none',
	height: '100%',
	minHeight: '360px',
	width: '100%',
})

// Features Section
export const featuresSection = style([
	section,
	{
		backgroundColor: vars.color.background,
	},
])

export const featuresSectionTitle = style({
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize['2xl'],
		},
	},
	color: vars.color.secondary,
	fontSize: vars.fontSize['3xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space[12],
	textAlign: 'center',
})

export const featuresGrid = style({
	display: 'grid',
	gap: vars.space[8],
	gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
	margin: '0 auto',
	maxWidth: '1200px',
})

export const featureCard = style([
	card,
	{
		padding: vars.space[8],
		textAlign: 'center',
	},
])

export const featureIcon = style({
	alignItems: 'center',
	backgroundColor: vars.color.primary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	display: 'flex',
	height: '64px',
	justifyContent: 'center',
	margin: '0 auto',
	marginBottom: vars.space[4],
	width: '64px',
})

export const featureTitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space[3],
})

export const featureText = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	lineHeight: vars.lineHeight.relaxed,
})

// Re-export container for convenience
export { container }
