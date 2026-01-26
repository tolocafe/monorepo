import { Trans } from '@lingui/react/macro'

import { formatMoney } from '@/lib/cart'
import type { MergedProduct } from '@/lib/shop-data'

import * as styles from './ProductCard.css'

type ProductCardProps = {
	product: MergedProduct
}

function BadgeLabel({
	badge,
}: {
	badge: 'bestseller' | 'limited' | 'new' | 'sale'
}) {
	switch (badge) {
		case 'bestseller': {
			return <Trans>Bestseller</Trans>
		}
		case 'limited': {
			return <Trans>Limited</Trans>
		}
		case 'new': {
			return <Trans>New</Trans>
		}
		case 'sale': {
			return <Trans>Sale</Trans>
		}
		default: {
			return badge satisfies never
		}
	}
}

export function ProductCard({ product }: ProductCardProps) {
	const firstVariant = product.variants.edges[0]?.node
	const compareAtPrice = firstVariant?.compareAtPrice

	return (
		<article className={styles.card}>
			<div className={styles.imageWrapper}>
				{product.featuredImage ? (
					<img
						src={product.featuredImage.url}
						alt={product.featuredImage.altText || product.title}
						className={styles.image}
						loading="lazy"
					/>
				) : (
					<div className={styles.imagePlaceholder}>
						<ImagePlaceholderIcon />
					</div>
				)}
				{!product.availableForSale && (
					<span className={styles.soldOutBadge}>
						<Trans>Sold out</Trans>
					</span>
				)}
				{product.badge && product.availableForSale && (
					<span className={styles.productBadge}>
						<BadgeLabel badge={product.badge} />
					</span>
				)}
			</div>

			<div className={styles.content}>
				{product.productType && (
					<span className={styles.productType}>{product.productType}</span>
				)}

				<h3 className={styles.title}>{product.title}</h3>

				{product.excerpt && <p className={styles.excerpt}>{product.excerpt}</p>}

				<div className={styles.priceWrapper}>
					<span className={styles.price}>
						<Trans>
							Starting from {formatMoney(product.priceRange.minVariantPrice)}
						</Trans>
					</span>
					{compareAtPrice && (
						<span className={styles.comparePrice}>
							{formatMoney(compareAtPrice)}
						</span>
					)}
				</div>
			</div>
		</article>
	)
}

function ImagePlaceholderIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="48"
			height="48"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			style={{ opacity: 0.3 }}
		>
			<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
			<circle cx="9" cy="9" r="2" />
			<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
		</svg>
	)
}
