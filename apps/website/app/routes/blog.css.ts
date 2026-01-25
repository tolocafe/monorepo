import { style } from '@vanilla-extract/css'

import {
	vars,
	containerNarrow,
	pageMain,
	pageHeader,
	pageHeading,
	pageSubtitle,
} from '@/styles'

export const main = pageMain

export const container = containerNarrow

export const header = pageHeader

export const heading = pageHeading

export const subtitle = pageSubtitle

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space['4xl'],
})

export const comingSoonCard = style({
	backgroundColor: vars.color.surface,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius['2xl'],
	padding: vars.space['2xl'],
	textAlign: 'center',
})

export const badge = style({
	backgroundColor: vars.color.secondary,
	borderRadius: vars.radius.full,
	color: vars.color.white,
	display: 'inline-block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space.base,
	padding: `${vars.space.sm} ${vars.space.base}`,
})

export const message = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	lineHeight: vars.lineHeight.relaxed,
	margin: '0 auto',
	maxWidth: '600px',
})

export const previewSection = style({
	textAlign: 'center',
})

export const previewTitle = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space['2xl'],
})

export const topicsGrid = style({
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
})

export const topicCard = style({
	backgroundColor: vars.color.background,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.xl,
	padding: vars.space.xl,
	textAlign: 'left',
})

export const topicTitle = style({
	color: vars.color.secondary,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	marginBottom: vars.space.sm,
})

export const topicDescription = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	lineHeight: vars.lineHeight.relaxed,
})

// Post list styles
export const postsList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const postCard = style({
	'@media': {
		'(max-width: 640px)': {
			flexDirection: 'column',
		},
	},
	backgroundColor: vars.color.background,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius['2xl'],
	display: 'flex',
	gap: vars.space.xl,
	padding: vars.space.xl,
	textDecoration: 'none',
})

export const postImageWrapper = style({
	'@media': {
		'(max-width: 640px)': {
			height: '180px',
			width: '100%',
		},
	},
	borderRadius: vars.radius.xl,
	flexShrink: 0,
	height: '140px',
	overflow: 'hidden',
	width: '200px',
})

export const postImage = style({
	height: '100%',
	objectFit: 'cover',
	width: '100%',
})

export const postContent = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: vars.space.sm,
})

export const postTitle = style({
	color: vars.color.text,
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
	lineHeight: vars.lineHeight.tight,
})

export const postExcerpt = style({
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: 2,
	color: vars.color.text,
	display: '-webkit-box',
	fontSize: vars.fontSize.base,
	lineHeight: vars.lineHeight.relaxed,
	overflow: 'hidden',
})

export const postDate = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	marginTop: 'auto',
})
