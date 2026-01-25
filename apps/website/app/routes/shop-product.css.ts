import { style } from '@vanilla-extract/css'

import {
	vars,
	containerWide,
	pageMain,
	backLink as sharedBackLink,
	quantityControls as sharedQuantityControls,
	quantityButton as sharedQuantityButton,
	quantityValue as sharedQuantityValue,
	emptyState,
	emptyTitle as sharedEmptyTitle,
	emptyMessage as sharedEmptyMessage,
} from '@/styles'

export const main = pageMain

export const container = containerWide

export const backLink = sharedBackLink

export const productLayout = style({
	'@media': {
		'(min-width: 768px)': {
			gap: vars.space['4xl'],
			gridTemplateColumns: '1fr 1fr',
		},
	},
	display: 'grid',
	gap: vars.space['2xl'],
	gridTemplateColumns: '1fr',
})

export const imageSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.base,
})

export const mainImage = style({
	aspectRatio: '1',
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius['2xl'],
	objectFit: 'cover',
	width: '100%',
})

export const thumbnailGrid = style({
	display: 'grid',
	gap: vars.space.sm,
	gridTemplateColumns: 'repeat(4, 1fr)',
})

export const thumbnail = style({
	':hover': {
		borderColor: vars.color.primary,
	},
	aspectRatio: '1',
	border: `2px solid transparent`,
	borderRadius: vars.radius.lg,
	cursor: 'pointer',
	objectFit: 'cover',
	width: '100%',
})

export const thumbnailActive = style({
	borderColor: vars.color.primary,
})

export const detailsSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const title = style({
	fontSize: vars.fontSize['3xl'],
	fontWeight: vars.fontWeight.bold,
	lineHeight: vars.lineHeight.tight,
})

export const price = style({
	color: vars.color.text,
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.semibold,
})

export const comparePrice = style({
	color: vars.color.text,
	fontSize: vars.fontSize.lg,
	marginLeft: vars.space.sm,
	opacity: 0.6,
	textDecoration: 'line-through',
})

export const description = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	lineHeight: vars.lineHeight.relaxed,
})

export const bodyContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.base,
})

export const bodyHeading = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	lineHeight: vars.lineHeight.tight,
	marginTop: vars.space.sm,
})

export const bodySubheading = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.semibold,
	lineHeight: vars.lineHeight.tight,
	marginTop: vars.space.xs,
})

export const bodyParagraph = style({
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	lineHeight: vars.lineHeight.relaxed,
})

export const bodyList = style({
	color: vars.color.text,
	display: 'flex',
	flexDirection: 'column',
	fontSize: vars.fontSize.base,
	gap: vars.space.sm,
	lineHeight: vars.lineHeight.relaxed,
	paddingLeft: vars.space.xl,
})

export const bodyListItem = style({
	color: vars.color.text,
})

export const bodyLink = style({
	':hover': {
		textDecoration: 'underline',
	},
	color: vars.color.primary,
	textDecoration: 'none',
})

export const variantSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const variantLabel = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	textTransform: 'uppercase',
})

export const variantOptions = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space.sm,
})

export const variantOption = style({
	':hover': {
		borderColor: vars.color.primary,
	},
	backgroundColor: vars.color.surface,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.md,
	cursor: 'pointer',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	padding: `${vars.space.sm} ${vars.space.base}`,
})

export const variantOptionSelected = style({
	backgroundColor: vars.color.primary,
	borderColor: vars.color.primary,
	color: vars.color.white,
})

export const quantitySection = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.base,
})

export const quantityLabel = style({
	color: vars.color.text,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.semibold,
	textTransform: 'uppercase',
})

export const quantityControls = sharedQuantityControls

export const quantityButton = sharedQuantityButton

export const quantityValue = sharedQuantityValue

export const addToCartButton = style({
	':disabled': {
		cursor: 'not-allowed',
		opacity: 0.6,
	},
	':hover': {
		filter: 'brightness(1.05)',
	},
	alignItems: 'center',
	backgroundColor: vars.color.secondary,
	border: 'none',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	cursor: 'pointer',
	display: 'flex',
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.semibold,
	gap: vars.space.sm,
	justifyContent: 'center',
	padding: `${vars.space.base} ${vars.space.xl}`,
	selectors: {
		'&:disabled:hover': {
			filter: 'none',
		},
	},
	width: '100%',
})

export const soldOut = style({
	backgroundColor: vars.color.border,
	borderRadius: vars.radius.full,
	color: vars.color.text,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.semibold,
	padding: `${vars.space.base} ${vars.space.xl}`,
	textAlign: 'center',
})

export const notFound = emptyState

export const notFoundTitle = sharedEmptyTitle

export const notFoundText = sharedEmptyMessage
