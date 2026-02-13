import { style } from '@vanilla-extract/css'

import { vars } from '@/styles/tokens.css'

export const main = style({
	backgroundColor: vars.color.background,
	minHeight: 'calc(100vh - 200px)',
	padding: `${vars.space.xl} ${vars.space.xl}`,
})

export const container = style({
	margin: '0 auto',
	maxWidth: '800px',
})

export const backLink = style({
	alignItems: 'center',
	color: vars.color.secondary,
	display: 'inline-flex',
	fontWeight: vars.fontWeight.medium,
	gap: vars.space.sm,
	marginBottom: vars.space.lg,
	textDecoration: 'none',
})

export const article = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const header = style({
	marginBottom: vars.space.md,
})

export const title = style({
	lineHeight: vars.lineHeight.tight,
	marginBottom: vars.space.md,
})

export const subtitle = style({
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.space.md,
})

export const meta = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.md,
})

export const date = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.sm,
})

export const imageWrapper = style({
	aspectRatio: '16 / 9',
	borderRadius: vars.radius.lg,
	marginBottom: vars.space.md,
	overflow: 'hidden',
	width: '100%',
})

export const image = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const body = style({
	lineHeight: vars.lineHeight.relaxed,
})

// Portable Text block styles
export const paragraph = style({
	marginBottom: vars.space.xl,
})

export const heading2 = style({
	marginBottom: vars.space.md,
	marginTop: vars.space.lg,
})

export const heading3 = style({
	marginBottom: vars.space.md,
	marginTop: vars.space.xl,
})

export const blockquote = style({
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
	padding: vars.space.xl,
	textAlign: 'center',
})

export const notFoundTitle = style({
	marginBottom: vars.space.md,
})

export const notFoundText = style({
	marginBottom: vars.space.lg,
})

// Suggested Readings section styles
export const suggestedSection = style({
	marginTop: vars.space.xl,
	paddingTop: vars.space.lg,
})

export const suggestedTitle = style({
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
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.lg,
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	textDecoration: 'none',
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
	padding: vars.space.md,
})

export const suggestedCardTitle = style({
	color: vars.color.text,
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
