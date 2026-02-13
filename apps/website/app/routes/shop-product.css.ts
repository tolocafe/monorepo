import { style } from '@vanilla-extract/css'

import {
	containerWide,
	pageMain,
	backLink as sharedBackLink,
	quantityControls as sharedQuantityControls,
	quantityButton as sharedQuantityButton,
	quantityValue as sharedQuantityValue,
	emptyState,
	emptyTitle as sharedEmptyTitle,
	emptyMessage as sharedEmptyMessage,
} from '@/styles/global.css'
import { vars } from '@/styles/tokens.css'

export const main = pageMain

export const container = containerWide

export const backLink = sharedBackLink

export const productLayout = style({
	'@media': {
		'(min-width: 768px)': {
			gap: vars.space.xl,
			gridTemplateColumns: '1fr 1fr',
		},
	},
	display: 'grid',
	gap: vars.space.xl,
	gridTemplateColumns: '1fr',
})

export const imageSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const mainImage = style({
	aspectRatio: '1',
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.lg,
	objectFit: 'cover',
	width: '100%',
})

export const thumbnailGrid = style({
	display: 'grid',
	gap: vars.space.sm,
	gridTemplateColumns: 'repeat(4, 1fr)',
})

export const thumbnail = style({
	aspectRatio: '1',
	borderRadius: vars.radius.lg,
	cursor: 'pointer',
	objectFit: 'cover',
	width: '100%',
})

export const thumbnailActive = style({
	opacity: 0.6,
})

export const detailsSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.xl,
})

export const title = style({
	lineHeight: vars.lineHeight.tight,
})

export const excerpt = style({
	lineHeight: vars.lineHeight.relaxed,
	opacity: 0.8,
})

export const price = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.semibold,
})

export const comparePrice = style({
	fontSize: vars.fontSize.lg,
	marginLeft: vars.space.sm,
	opacity: 0.6,
	textDecoration: 'line-through',
})

export const description = style({
	lineHeight: vars.lineHeight.relaxed,
})

export const bodyContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const bodyHeading = style({
	marginTop: vars.space.sm,
})

export const bodySubheading = style({
	marginTop: vars.space.xs,
})

export const bodyParagraph = style({
	lineHeight: vars.lineHeight.relaxed,
})

export const bodyList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.sm,
	lineHeight: vars.lineHeight.relaxed,
	paddingLeft: vars.space.xl,
})

export const bodyListItem = style({})

export const bodyLink = style({
	color: vars.color.primary,
	textDecoration: 'none',
})

export const variantSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.md,
})

export const variantLabel = style({
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
	backgroundColor: vars.color.surface,
	borderRadius: vars.radius.md,
	cursor: 'pointer',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	padding: `${vars.space.sm} ${vars.space.md}`,
})

export const variantOptionSelected = style({
	backgroundColor: vars.color.primary,
	color: vars.color.white,
})

export const quantitySection = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.md,
})

export const quantityLabel = style({
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
	alignItems: 'center',
	backgroundColor: vars.color.secondary,
	border: 'none',
	borderRadius: vars.radius.full,
	color: vars.color.white,
	cursor: 'pointer',
	display: 'flex',
	fontWeight: vars.fontWeight.semibold,
	gap: vars.space.sm,
	justifyContent: 'center',
	padding: `${vars.space.md} ${vars.space.xl}`,
	width: '100%',
})

export const soldOut = style({
	backgroundColor: vars.color.border,
	borderRadius: vars.radius.full,
	fontWeight: vars.fontWeight.semibold,
	padding: `${vars.space.md} ${vars.space.xl}`,
	textAlign: 'center',
})

export const descriptionSection = style({
	marginTop: vars.space.xl,
	paddingTop: vars.space.xl,
})

export const descriptionTitle = style({
	marginBottom: vars.space.xl,
})

export const descriptionContent = style({
	'@media': {
		'(min-width: 768px)': {
			maxWidth: '65ch',
		},
	},
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.lg,
})

export const relatedSection = style({
	marginTop: vars.space.xl,
	paddingTop: vars.space.xl,
})

export const relatedTitle = style({
	marginBottom: vars.space.xl,
})

export const relatedGrid = style({
	display: 'grid',
	gap: vars.space.md,
	gridTemplateColumns: 'repeat(3, 1fr)',
	maxWidth: '600px',
})

export const relatedItem = style({
	textDecoration: 'none',
})

export const notFound = emptyState

export const notFoundTitle = sharedEmptyTitle

export const notFoundText = sharedEmptyMessage
