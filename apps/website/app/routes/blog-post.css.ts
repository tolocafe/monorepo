import { style } from '@vanilla-extract/css'

import { vars } from '@/styles'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space['4xl']} ${vars.space.xl}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const backLink = style({
	alignItems: 'center',
	color: vars.color.secondary,
	display: 'inline-flex',
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	gap: vars.space.sm,
	marginBottom: vars.space['2xl'],
	textDecoration: 'none',
})

export const article = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const header = style({
	marginBottom: vars.space.base,
})

export const title = style({
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize['3xl'],
		},
	},
	fontSize: vars.fontSize['4xl'],
	fontWeight: vars.fontWeight.bold,
	lineHeight: vars.lineHeight.tight,
	marginBottom: vars.space.base,
})

export const subtitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space.base,
})

export const meta = style({
	alignItems: 'center',
	color: vars.color.text,
	display: 'flex',
	fontSize: vars.fontSize.base,
	gap: vars.space.base,
})

export const date = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.sm,
})

export const imageWrapper = style({
	aspectRatio: '16 / 9',
	borderRadius: vars.radius['2xl'],
	marginBottom: vars.space.base,
	overflow: 'hidden',
	width: '100%',
})

export const image = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const body = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
})

// Portable Text block styles
export const paragraph = style({
	marginBottom: vars.space.xl,
})

export const heading2 = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space.base,
	marginTop: vars.space['2xl'],
})

export const heading3 = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space.md,
	marginTop: vars.space.xl,
})

export const blockquote = style({
	borderLeft: `4px solid ${vars.color.secondary}`,
	color: vars.color.text,
	fontStyle: 'italic',
	marginBottom: vars.space.xl,
	marginLeft: 0,
	marginRight: 0,
	marginTop: vars.space.xl,
	paddingLeft: vars.space.xl,
})

export const list = style({
	marginBottom: vars.space.xl,
	paddingLeft: vars.space.xl,
})

export const listItem = style({
	marginBottom: vars.space.sm,
})

export const link = style({
	color: vars.color.secondary,
	textDecoration: 'underline',
})

export const notFound = style({
	padding: vars.space['4xl'],
	textAlign: 'center',
})

export const notFoundTitle = style({
	fontSize: vars.fontSize['3xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space.base,
})

export const notFoundText = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	marginBottom: vars.space['2xl'],
})

// Suggested Readings section styles
export const suggestedSection = style({
	borderTop: `1px solid ${vars.color.border}`,
	marginTop: vars.space['4xl'],
	paddingTop: vars.space['3xl'],
})

export const suggestedTitle = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	marginBottom: vars.space.xl,
})

export const suggestedGrid = style({
	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(3, 1fr)',
})

export const suggestedCard = style({
	':hover': {
		transform: 'translateY(-2px)',
	},
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.xl,
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	textDecoration: 'none',
	transition: 'transform 0.2s ease',
})

export const suggestedImageWrapper = style({
	aspectRatio: '16 / 9',
	overflow: 'hidden',
	width: '100%',
})

export const suggestedImage = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const suggestedContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.sm,
	padding: vars.space.base,
})

export const suggestedCardTitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.semibold,
	lineHeight: vars.lineHeight.tight,
})

export const suggestedExcerpt = style({
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: 2,
	color: vars.color.text,
	display: '-webkit-box',
	fontSize: vars.fontSize.sm,
	lineHeight: vars.lineHeight.relaxed,
	overflow: 'hidden',
})

export const suggestedDate = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.sm,
})
