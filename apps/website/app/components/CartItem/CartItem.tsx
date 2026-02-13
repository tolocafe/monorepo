import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Link } from 'react-router'

import { formatMoney } from '@/lib/cart'
import type { Locale } from '@/lib/locale'
import type { ShopifyCartLine } from '@/lib/shopify'

import * as styles from './CartItem.css'

type CartItemProps = {
	isUpdating: boolean
	line: ShopifyCartLine
	locale: Locale
	onRemove: () => void
	onUpdateQuantity: (quantity: number) => void
}

export function CartItem({
	line,
	locale,
	isUpdating,
	onUpdateQuantity,
	onRemove,
}: CartItemProps) {
	const productImage = line.merchandise.product.featuredImage

	return (
		<div className={styles.cartItem}>
			{productImage && (
				<Link to={`/${locale}/shop/${line.merchandise.product.handle}`}>
					<img
						src={productImage.url}
						alt={productImage.altText || line.merchandise.product.title}
						className={styles.itemImage}
					/>
				</Link>
			)}

			<div className={styles.itemDetails}>
				<Link
					to={`/${locale}/shop/${line.merchandise.product.handle}`}
					className={styles.itemTitle}
				>
					{line.merchandise.product.title}
				</Link>
				{line.merchandise.title !== 'Default Title' && (
					<span className={styles.itemVariant}>{line.merchandise.title}</span>
				)}
				<span className={styles.itemPrice}>
					{formatMoney(line.cost.totalAmount)}
				</span>
			</div>

			<div className={styles.itemActions}>
				<div className={styles.quantityControls}>
					<button
						type="button"
						className={styles.quantityButton}
						onClick={() => onUpdateQuantity(line.quantity - 1)}
						disabled={isUpdating || line.quantity <= 1}
						aria-label={t`Decrease quantity`}
					>
						-
					</button>
					<span className={styles.quantityValue}>{line.quantity}</span>
					<button
						type="button"
						className={styles.quantityButton}
						onClick={() => onUpdateQuantity(line.quantity + 1)}
						disabled={isUpdating}
						aria-label={t`Increase quantity`}
					>
						+
					</button>
				</div>

				<button
					type="button"
					className={styles.removeButton}
					onClick={onRemove}
					disabled={isUpdating}
				>
					<Trans>Remove</Trans>
				</button>
			</div>
		</div>
	)
}
