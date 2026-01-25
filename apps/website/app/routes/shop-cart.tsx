import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router'

import {
	formatMoney,
	getCartIdFromCookies,
	getCartLines,
	clearCartCookie,
	setCookie,
} from '@/lib/cart'
import type { Locale } from '@/lib/locale'
import { shopifyApi } from '@/lib/shopify'
import type { ShopifyCart, ShopifyCartLine } from '@/lib/shopify'

import type { Route } from './+types/shop-cart'
import * as styles from './shop-cart.css'

const META_TRANSLATIONS = {
	de: {
		description: 'Verwalten Sie Ihren Warenkorb',
		title: 'Warenkorb - TOLO',
	},
	en: {
		description: 'Manage your shopping cart',
		title: 'Cart - TOLO',
	},
	es: {
		description: 'Administra tu carrito de compras',
		title: 'Carrito - TOLO',
	},
	fr: {
		description: 'G\u00e9rez votre panier',
		title: 'Panier - TOLO',
	},
	ja: {
		description:
			'\u30b7\u30e7\u30c3\u30d4\u30f3\u30b0\u30ab\u30fc\u30c8\u3092\u7ba1\u7406',
		title: '\u30ab\u30fc\u30c8 - TOLO',
	},
} as const

export function meta({ params }: Route.MetaArgs) {
	const locale = (params.locale as Locale) || 'es'
	const t = META_TRANSLATIONS[locale] || META_TRANSLATIONS.es

	return [{ title: t.title }, { content: t.description, name: 'description' }]
}

export default function ShopCart() {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const [cart, setCart] = useState<ShopifyCart | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [updatingLineId, setUpdatingLineId] = useState<string | null>(null)

	useEffect(() => {
		async function loadCart() {
			const cartId = getCartIdFromCookies(document.cookie)
			if (!cartId) {
				setIsLoading(false)
				return
			}

			const loadedCart = await shopifyApi.cart.get(cartId)
			setCart(loadedCart)
			setIsLoading(false)
		}

		loadCart()
	}, [])

	async function handleUpdateQuantity(lineId: string, quantity: number) {
		if (!cart || updatingLineId) return

		setUpdatingLineId(lineId)

		try {
			if (quantity <= 0) {
				const updatedCart = await shopifyApi.cart.removeLines(cart.id, [lineId])
				setCart(updatedCart)
			} else {
				const updatedCart = await shopifyApi.cart.updateLines(cart.id, [
					{ id: lineId, quantity },
				])
				setCart(updatedCart)
			}
		} catch {
			// Error handling
		} finally {
			setUpdatingLineId(null)
		}
	}

	async function handleRemoveItem(lineId: string) {
		if (!cart || updatingLineId) return

		setUpdatingLineId(lineId)

		try {
			const updatedCart = await shopifyApi.cart.removeLines(cart.id, [lineId])
			setCart(updatedCart)

			// Clear cart cookie if empty
			if (updatedCart && updatedCart.totalQuantity === 0) {
				setCookie(clearCartCookie())
			}
		} catch {
			// Error handling
		} finally {
			setUpdatingLineId(null)
		}
	}

	const lines = getCartLines(cart)
	const isEmpty = lines.length === 0

	if (isLoading) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<div className={styles.loading}>
						<Trans>Loading cart...</Trans>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<Link to={`/${locale}/shop`} className={styles.backLink}>
					<Trans>\u2190 Continue Shopping</Trans>
				</Link>

				<header className={styles.header}>
					<h1 className={styles.heading}>
						<Trans>Your Cart</Trans>
					</h1>
				</header>

				{isEmpty ? (
					<div className={styles.emptyCart}>
						<h2 className={styles.emptyTitle}>
							<Trans>Your cart is empty</Trans>
						</h2>
						<p className={styles.emptyMessage}>
							<Trans>
								Looks like you have not added any items to your cart yet.
							</Trans>
						</p>
						<Link to={`/${locale}/shop`} className={styles.shopNowButton}>
							<Trans>Shop Now</Trans>
						</Link>
					</div>
				) : (
					<>
						<div className={styles.cartContent}>
							{lines.map((line: ShopifyCartLine) => (
								<CartItem
									key={line.id}
									line={line}
									locale={locale}
									isUpdating={updatingLineId === line.id}
									onUpdateQuantity={(quantity) =>
										handleUpdateQuantity(line.id, quantity)
									}
									onRemove={() => handleRemoveItem(line.id)}
								/>
							))}
						</div>

						<div className={styles.cartSummary}>
							<div className={styles.summaryRow}>
								<span className={styles.summaryLabel}>
									<Trans>Subtotal</Trans>
								</span>
								<span className={styles.summaryValue}>
									{cart && formatMoney(cart.cost.subtotalAmount)}
								</span>
							</div>

							<div className={styles.totalRow}>
								<span className={styles.totalLabel}>
									<Trans>Total</Trans>
								</span>
								<span className={styles.totalValue}>
									{cart && formatMoney(cart.cost.totalAmount)}
								</span>
							</div>

							<a
								href={cart?.checkoutUrl}
								className={styles.checkoutButton}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Trans>Checkout</Trans>
							</a>

							<Link
								to={`/${locale}/shop`}
								className={styles.continueShoppingLink}
							>
								<Trans>Continue Shopping</Trans>
							</Link>
						</div>
					</>
				)}
			</div>
		</main>
	)
}

type CartItemProps = {
	isUpdating: boolean
	line: ShopifyCartLine
	locale: Locale
	onRemove: () => void
	onUpdateQuantity: (quantity: number) => void
}

function CartItem({
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
