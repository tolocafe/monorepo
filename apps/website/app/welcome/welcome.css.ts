import { style } from '@vanilla-extract/css'

import { card, section, container } from '@/styles/global.css'
import { vars } from '@/styles/tokens.css'

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
	minHeight: '100svh',
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
		'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.85) 100%)',
	inset: 0,
	position: 'absolute',
})

export const heroContent = style({
	'@media': {
		'(min-width: 768px)': {
			padding: `${vars.space.xl} ${vars.space.xl}`,
			textAlign: 'left',
		},
	},
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
	justifyContent: 'space-between',
	margin: '0 auto',
	maxWidth: '1100px',
	padding: `${vars.space.xl} ${vars.space.xl}`,
	position: 'relative',
	textAlign: 'center',
	zIndex: 10,
})

export const heroTitle = style({
	color: vars.color.white,
	fontSize: 'clamp(3rem, 8vw, 6rem)',
	letterSpacing: '-0.02em',
	marginBottom: vars.space.md,
	textTransform: 'none',
})

export const heroSubtitle = style({
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.lg,
		},
	},
	color: 'rgba(255, 255, 255, 0.9)',
	fontSize: vars.fontSize.lg,
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
	gap: vars.space.md,
	justifyContent: 'center',
	marginBottom: 'auto',
	marginTop: vars.space.xl,
})

export const heroTrustBar = style({
	'@media': {
		'(max-width: 640px)': {
			gap: vars.space.lg,
			justifyContent: 'center',
		},
		'(min-width: 768px)': {
			gap: vars.space.xl,
			justifyContent: 'flex-start',
		},
	},
	display: 'flex',
	gap: vars.space.xl,
	justifyContent: 'center',
	paddingTop: vars.space.xl,
	width: '100%',
})

export const heroTrustItem = style({
	textAlign: 'center',
})

export const heroTrustValue = style({
	color: vars.color.white,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	lineHeight: vars.lineHeight.none,
})

export const heroTrustLabel = style({
	color: 'rgba(255, 255, 255, 0.8)',
	fontSize: vars.fontSize.sm,
	lineHeight: vars.lineHeight.normal,
	marginTop: vars.space.sm,
})

// Quick Links Section
export const quickLinksSection = style({
	'@media': {
		'(min-width: 768px)': {
			padding: `${vars.space.xl} ${vars.space.xl}`,
		},
	},
	padding: `${vars.space.xl} ${vars.space.xl}`,
})
export const quickLinksGrid = style({
	'@media': {
		'(min-width: 768px)': {
			gap: vars.space.xl,
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: '1fr',
})

export const quickCard = style([
	card,
	{
		':focus-visible': {
			outline: `2px solid ${vars.color.primary}`,
			outlineOffset: '3px',
		},
		borderRadius: vars.radius.lg,
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		padding: 0,
		textDecoration: 'none',
	},
])

export const quickCardImage = style({
	aspectRatio: '16 / 10',
	objectFit: 'cover',
	width: '100%',
})

export const quickCardBody = style({
	minWidth: 0,
	padding: vars.space.md,
})

export const quickCardTitle = style({
	color: vars.color.text,
	marginBottom: vars.space.sm,
})

export const quickCardText = style({
	color: vars.color.text,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space.md,
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
		'@media': {
			'(min-width: 768px)': {
				padding: `${vars.space.xl} ${vars.space.xl}`,
			},
		},
		padding: `${vars.space.xl} ${vars.space.xl}`,
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
	marginBottom: vars.space.xl,
})

// Section Header with title + description on left, link on right
export const sectionHeader = style({
	alignItems: 'flex-end',
	display: 'flex',
	gap: vars.space.xl,
	justifyContent: 'space-between',
	flexDirection: 'column',
	marginBottom: vars.space.xl,
	'@media': {
		'(min-width: 640px)': {
			flexDirection: 'row',
			alignItems: 'center',
		},
	},
})

export const sectionHeaderText = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.sm,
})

export const sectionDescription = style({
	color: vars.color.text,
	lineHeight: vars.lineHeight.relaxed,
	opacity: 0.8,
})

export const sectionLink = style({
	color: vars.color.primary,
	fontWeight: vars.fontWeight.semibold,
	textDecoration: 'none',
	whiteSpace: 'nowrap',
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
	gap: vars.space.xl,
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

export const aboutImage = style({
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

export const featuresGrid = style({
	'@media': {
		'(min-width: 768px)': {
			gap: vars.space.xl,
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: '1fr',
	marginTop: vars.space.xl,
})

export const featureCard = style([
	card,
	{
		'@media': {
			'(min-width: 768px)': {
				padding: vars.space.xl,
			},
		},
		padding: vars.space.lg,
	},
])

export const featureTitle = style({
	marginBottom: vars.space.md,
})

export const featureText = style({
	lineHeight: vars.lineHeight.relaxed,
})

// Shop Section
export const shopGrid = style({
	'@media': {
		'(min-width: 768px)': {
			gap: vars.space.xl,
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: '1fr',
})

export const shopCardLink = style({
	textDecoration: 'none',
})

// App Section
export const splitSection = style({
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

export const storeButtons = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space.md,
	marginTop: vars.space.xl,
})

export const storeBadge = style({
	display: 'block',
	height: 50,
	width: 'auto',
})

export const appImage = style({
	aspectRatio: '3 / 4',
	borderRadius: vars.radius.lg,
	objectFit: 'contain',
	width: '100%',
})

export const appText = style({
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space.sm,
})

// Carousel (Stores near you)
export const carousel = style({
	display: 'flex',
	gap: vars.space.xl,
	overflowX: 'auto',
	paddingBottom: vars.space.md,
	scrollSnapType: 'x mandatory',
	selectors: {
		'&::-webkit-scrollbar': {
			display: 'none',
		},
	},
})

export const carouselCard = style([
	card,
	{
		':focus-visible': {
			outline: `2px solid ${vars.color.primary}`,
			outlineOffset: '3px',
		},
		'@media': {
			'(min-width: 768px)': {
				minWidth: '340px',
			},
		},
		display: 'flex',
		flex: '0 0 auto',
		flexDirection: 'column',
		minWidth: '280px',
		overflow: 'hidden',
		padding: 0,
		scrollSnapAlign: 'start',
		textDecoration: 'none',
	},
])

export const carouselCardImage = style({
	aspectRatio: '3 / 2',
	objectFit: 'cover',
	width: '100%',
})

export const carouselCardBody = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xs,
	padding: vars.space.md,
})

export const carouselCardHeader = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.sm,
})

export const carouselCardTitle = style({
	color: vars.color.text,
})

export const upcomingBadge = style({
	backgroundColor: vars.color.primary,
	borderRadius: vars.radius.md,
	color: vars.color.white,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	padding: `${vars.space.xs} ${vars.space.sm}`,
	textTransform: 'uppercase',
})

export const carouselCardCity = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	opacity: 0.7,
})

export const carouselCardDetail = style({
	color: vars.color.text,
	lineHeight: vars.lineHeight.relaxed,
})

// Blog Section
export const blogGrid = style({
	display: 'flex',
	gap: vars.space.xl,
	overflowX: 'auto',
	paddingBottom: vars.space.md,
	scrollSnapType: 'x mandatory',
	selectors: {
		'&::-webkit-scrollbar': {
			display: 'none',
		},
	},
})

export const blogCard = style([
	card,
	{
		':focus-visible': {
			outline: `2px solid ${vars.color.primary}`,
			outlineOffset: '3px',
		},
		'@media': {
			'(min-width: 768px)': {
				width: '340px',
			},
		},
		display: 'flex',
		flex: 'none',
		flexDirection: 'column',
		overflow: 'hidden',
		padding: 0,
		scrollSnapAlign: 'start',
		textDecoration: 'none',
		width: '280px',
	},
])

export const blogCardImage = style({
	aspectRatio: '16 / 9',
	objectFit: 'cover',
	width: '100%',
})

export const blogCardBody = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: vars.space.sm,
	padding: vars.space.md,
})

export const blogCardTitle = style({
	color: vars.color.text,
})

export const blogCardExcerpt = style({
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: 2,
	color: vars.color.text,
	display: '-webkit-box',
	lineHeight: vars.lineHeight.relaxed,
	opacity: 0.8,
	overflow: 'hidden',
})

export const blogCardDate = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	marginTop: 'auto',
	opacity: 0.6,
})

// Re-export container for convenience
export { container }
