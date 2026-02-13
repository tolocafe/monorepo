import { t } from '@lingui/core/macro'
import { IconShoppingCart } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { getCartIdFromCookies, getCartItemCount } from '@/lib/cart'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/locale'
import { shopifyApi } from '@/lib/shopify'

import * as styles from './CartIcon.css'

export function CartIcon() {
	const { locale: localeParam } = useParams<{ locale: string }>()
	const currentLocale = isValidLocale(localeParam)
		? localeParam
		: DEFAULT_LOCALE

	const [itemCount, setItemCount] = useState(0)

	useEffect(() => {
		async function loadCartCount() {
			const cartId = getCartIdFromCookies(document.cookie)
			if (!cartId) return

			const cart = await shopifyApi.cart.get(cartId)
			if (cart) {
				setItemCount(getCartItemCount(cart))
			}
		}

		loadCartCount()

		// Listen for cart updates via custom event
		function handleCartUpdate(event: CustomEvent<{ count: number }>) {
			setItemCount(event.detail.count)
		}

		globalThis.addEventListener(
			'cart-updated' as keyof WindowEventMap,
			handleCartUpdate as EventListener,
		)
		return () => {
			globalThis.removeEventListener(
				'cart-updated' as keyof WindowEventMap,
				handleCartUpdate as EventListener,
			)
		}
	}, [])

	return (
		<Link
			to={`/${currentLocale}/shop/cart`}
			className={styles.cartLink}
			aria-label={t`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
		>
			<IconShoppingCart size={26} aria-hidden="true" />
			{itemCount > 0 && (
				<span className={styles.badge} aria-hidden="true">
					{itemCount > 99 ? '99+' : itemCount}
				</span>
			)}
		</Link>
	)
}
