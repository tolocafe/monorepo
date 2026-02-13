import { Trans } from '@lingui/react/macro'

import { BadgeLabel } from '@/components/BadgeLabel'
import { ImagePlaceholderIcon } from '@/components/ImagePlaceholderIcon'
import { formatMoney } from '@/lib/cart'
import type { MergedProduct } from '@/lib/shop-data'

import * as styles from './ProductCard.css'

type Props = {
	product: MergedProduct
}

export function ProductCard({ product }: Props) {
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
