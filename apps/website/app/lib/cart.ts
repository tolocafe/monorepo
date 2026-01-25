/**
 * Cart Management Utilities
 *
 * Handles cart ID storage in cookies and provides helpers for cart operations.
 */

import { shopifyApi } from './shopify'
import type { ShopifyCart } from './shopify'

const CART_COOKIE_NAME = 'tolo_cart_id'
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Parse cookies from a cookie header string
 */
export function parseCookies(
	cookieHeader: string | null,
): Record<string, string> {
	if (!cookieHeader) return {}
	return Object.fromEntries(
		cookieHeader.split(';').map((c) => {
			const [key, ...rest] = c.trim().split('=')
			return [key, rest.join('=')]
		}),
	)
}

/**
 * Get cart ID from cookies
 */
export function getCartIdFromCookies(
	cookieHeader: string | null,
): string | null {
	const cookies = parseCookies(cookieHeader)
	return cookies[CART_COOKIE_NAME] || null
}

/**
 * Create a Set-Cookie header value for the cart ID
 */
export function createCartCookie(cartId: string): string {
	return `${CART_COOKIE_NAME}=${cartId}; Path=/; Max-Age=${CART_COOKIE_MAX_AGE}; SameSite=Lax; Secure`
}

/**
 * Create a Set-Cookie header to clear the cart cookie
 */
export function clearCartCookie(): string {
	return `${CART_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; Secure`
}

/**
 * Get or create a cart, returning the cart and whether it was newly created
 */
export async function getOrCreateCart(
	cartId: string | null,
): Promise<{ cart: ShopifyCart; isNew: boolean } | null> {
	if (cartId) {
		const existingCart = await shopifyApi.cart.get(cartId)
		if (existingCart) {
			return { cart: existingCart, isNew: false }
		}
	}

	const newCart = await shopifyApi.cart.create()
	if (newCart) {
		return { cart: newCart, isNew: true }
	}

	return null
}

/**
 * Format a Shopify money amount for display
 */
export function formatMoney(money: {
	amount: string
	currencyCode: string
}): string {
	const amount = Number.parseFloat(money.amount)
	return new Intl.NumberFormat('es-MX', {
		currency: money.currencyCode,
		style: 'currency',
	}).format(amount)
}

/**
 * Get the total quantity of items in a cart
 */
export function getCartItemCount(cart: ShopifyCart | null): number {
	return cart?.totalQuantity ?? 0
}

/**
 * Get cart lines as a flat array
 */
export function getCartLines(cart: ShopifyCart | null) {
	return cart?.lines.edges.map((edge) => edge.node) ?? []
}
