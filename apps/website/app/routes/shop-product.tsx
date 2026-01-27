import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { useState } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router'

import {
	formatMoney,
	getCartIdFromCookies,
	createCartCookie,
	setCookie,
} from '@/lib/cart'
import { OG_LOCALES } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { getProductBySlug } from '@/lib/shop-data'
import { shopifyApi } from '@/lib/shopify'
import type { ShopifyProduct, ShopifyProductVariant } from '@/lib/shopify'

import type { Route } from './+types/shop-product'
import * as styles from './shop-product.css'

const portableTextComponents: PortableTextComponents = {
	block: {
		h2: ({ children }) => <h2 className={styles.bodyHeading}>{children}</h2>,
		h3: ({ children }) => <h3 className={styles.bodySubheading}>{children}</h3>,
		normal: ({ children }) => (
			<p className={styles.bodyParagraph}>{children}</p>
		),
	},
	list: {
		bullet: ({ children }) => <ul className={styles.bodyList}>{children}</ul>,
		number: ({ children }) => <ol className={styles.bodyList}>{children}</ol>,
	},
	listItem: {
		bullet: ({ children }) => (
			<li className={styles.bodyListItem}>{children}</li>
		),
		number: ({ children }) => (
			<li className={styles.bodyListItem}>{children}</li>
		),
	},
	marks: {
		link: ({ children, value }) => (
			<a
				href={value?.href}
				target="_blank"
				rel="noopener noreferrer"
				className={styles.bodyLink}
			>
				{children}
			</a>
		),
		strong: ({ children }) => <strong>{children}</strong>,
	},
}

export async function loader({ params, request }: Route.LoaderArgs) {
	const { handle, locale } = params
	if (!handle) return { product: null, shopifyProduct: null }

	// Fetch merged data using localized slug lookup
	const product = await getProductBySlug(handle, (locale as Locale) || 'es')

	// Fetch raw Shopify data for structured data using the resolved handle
	const shopifyProduct = product
		? await shopifyApi.products.getByHandle(product.handle)
		: null

	// Build canonical URL using English slug for SEO
	const url = new URL(request.url)
	const canonicalUrl = `${url.origin}/en/shop/${product?.slug || product?.handle || handle}`

	return { canonicalUrl, product, shopifyProduct }
}

export function meta({ data, params }: Route.MetaArgs) {
	const { product, shopifyProduct, canonicalUrl } = data ?? {}
	const locale = (params.locale as Locale) || 'es'

	if (!product) {
		return [{ title: 'Product Not Found - TOLO' }]
	}

	const imageUrl = product.featuredImage?.url || product.images[0]?.url
	const baseUrl = 'https://tolo.cafe'
	const ogLocale = OG_LOCALES[locale] || 'es_MX'

	// Use Shopify data (English) for structured data, Sanity images preferred
	const structuredData = buildProductStructuredData(
		shopifyProduct,
		canonicalUrl,
		product?.images.map((img) => img.url),
	)

	const breadcrumbData = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				item: `${baseUrl}/${locale}`,
				name: 'TOLO',
				position: 1,
			},
			{
				'@type': 'ListItem',
				item: `${baseUrl}/${locale}/shop`,
				name: 'Shop',
				position: 2,
			},
			{
				'@type': 'ListItem',
				name: product.title,
				position: 3,
			},
		],
	}

	return [
		{ title: `${product.title} - TOLO Shop` },
		{ content: product.excerpt || product.description, name: 'description' },
		{ content: product.title, property: 'og:title' },
		{ content: 'product', property: 'og:type' },
		{ content: imageUrl || `${baseUrl}/og-image.png`, property: 'og:image' },
		{ content: canonicalUrl, property: 'og:url' },
		{
			content: product.excerpt || product.description,
			property: 'og:description',
		},
		{ content: 'TOLO', property: 'og:site_name' },
		{ content: ogLocale, property: 'og:locale' },
		...(structuredData ? [{ 'script:ld+json': structuredData }] : []),
		{ 'script:ld+json': breadcrumbData },
	]
}

/**
 * Build Schema.org Product structured data using Shopify data (English)
 * with Sanity images preferred over Shopify images
 * https://schema.org/Product
 */
function buildProductStructuredData(
	shopifyProduct: ShopifyProduct | null | undefined,
	canonicalUrl: string | undefined,
	sanityImages: string[] | undefined,
) {
	if (!shopifyProduct) return null

	const variants = shopifyProduct.variants.edges.map((e) => e.node)
	const hasMultipleVariants = variants.length > 1
	const [firstVariant] = variants

	// Build offers - use AggregateOffer if multiple variants with different prices
	const minPrice = shopifyProduct.priceRange.minVariantPrice
	const maxPrice = shopifyProduct.priceRange.maxVariantPrice
	const hasPriceRange = minPrice.amount !== maxPrice.amount

	const returnPolicy = {
		'@type': 'MerchantReturnPolicy',
		applicableCountry: 'MX',
		merchantReturnDays: 14,
		refundType: 'https://schema.org/StoreCreditRefund',
		returnFees: 'https://schema.org/FreeReturn',
		returnMethod: 'https://schema.org/ReturnByMail',
		returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
	}

	const shippingDetails = {
		'@type': 'OfferShippingDetails',
		deliveryTime: {
			'@type': 'ShippingDeliveryTime',
			businessDays: {
				'@type': 'OpeningHoursSpecification',
				dayOfWeek: [
					'https://schema.org/Monday',
					'https://schema.org/Tuesday',
					'https://schema.org/Wednesday',
					'https://schema.org/Thursday',
					'https://schema.org/Friday',
				],
			},
			handlingTime: {
				'@type': 'QuantitativeValue',
				maxValue: 1,
				minValue: 0,
				unitCode: 'd',
			},
			transitTime: {
				'@type': 'QuantitativeValue',
				maxValue: 5,
				minValue: 3,
				unitCode: 'd',
			},
		},
		shippingDestination: {
			'@type': 'DefinedRegion',
			addressCountry: 'MX',
		},
		shippingRate: {
			'@type': 'MonetaryAmount',
			currency: 'MXN',
			value: 0,
		},
		shippingSettingsLink: 'https://tolo.cafe/en/shipping',
	}

	const offers =
		hasMultipleVariants && hasPriceRange
			? {
					'@type': 'AggregateOffer',
					availability: shopifyProduct.availableForSale
						? 'https://schema.org/InStock'
						: 'https://schema.org/OutOfStock',
					hasMerchantReturnPolicy: returnPolicy,
					highPrice: maxPrice.amount,
					itemCondition: 'https://schema.org/NewCondition',
					lowPrice: minPrice.amount,
					offerCount: variants.length,
					priceCurrency: minPrice.currencyCode,
					shippingDetails,
				}
			: {
					'@type': 'Offer',
					availability: shopifyProduct.availableForSale
						? 'https://schema.org/InStock'
						: 'https://schema.org/OutOfStock',
					hasMerchantReturnPolicy: returnPolicy,
					itemCondition: 'https://schema.org/NewCondition',
					price: minPrice.amount,
					priceCurrency: minPrice.currencyCode,
					shippingDetails,
					...(firstVariant?.sku && { sku: firstVariant.sku }),
					...(canonicalUrl && { url: canonicalUrl }),
				}

	// Use Sanity images if available, fall back to Shopify images
	let images: string[]
	if (sanityImages && sanityImages.length > 0) {
		images = sanityImages
	} else {
		images = shopifyProduct.images.edges.map((e) => e.node.url)
		if (
			shopifyProduct.featuredImage &&
			!images.includes(shopifyProduct.featuredImage.url)
		) {
			images.unshift(shopifyProduct.featuredImage.url)
		}
	}

	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		...(canonicalUrl && { '@id': canonicalUrl }),
		brand: {
			'@type': 'Brand',
			name: shopifyProduct.vendor || 'TOLO Coffee',
		},
		...(shopifyProduct.productType && { category: shopifyProduct.productType }),
		description: shopifyProduct.description,
		image: images.length > 0 ? images : undefined,
		name: shopifyProduct.title,
		offers,
		...(firstVariant?.sku && { sku: firstVariant.sku }),
		...(canonicalUrl && { url: canonicalUrl }),
	}
}

export default function ShopProduct({ loaderData }: Route.ComponentProps) {
	const { locale } = useOutletContext<{ locale: Locale }>()
	const navigate = useNavigate()
	const { product } = loaderData

	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>(() => {
		if (!product?.options) return {}
		return Object.fromEntries(
			product.options
				.filter((opt) => opt.values.length > 0)
				.map((opt) => [opt.name, opt.values[0]]),
		)
	})
	const [quantity, setQuantity] = useState(1)
	const [isAddingToCart, setIsAddingToCart] = useState(false)
	const [selectedImageIndex, setSelectedImageIndex] = useState(0)

	if (!product) {
		return (
			<main className={styles.main}>
				<div className={styles.container}>
					<Link to={`/${locale}/shop`} className={styles.backLink}>
						<Trans>{'\u2190'} Back to Shop</Trans>
					</Link>
					<div className={styles.notFound}>
						<h1 className={styles.notFoundTitle}>
							<Trans>Product Not Found</Trans>
						</h1>
						<p className={styles.notFoundText}>
							<Trans>
								The product you are looking for does not exist or has been
								removed.
							</Trans>
						</p>
					</div>
				</div>
			</main>
		)
	}

	const variants = product.variants.edges.map((e) => e.node)
	const selectedVariant = findSelectedVariant(variants, selectedOptions)
	const mainImage = product.images[selectedImageIndex] || product.featuredImage

	async function handleAddToCart() {
		if (!selectedVariant || isAddingToCart) return

		setIsAddingToCart(true)

		try {
			const cartId = getCartIdFromCookies(document.cookie)
			let cart

			if (cartId) {
				cart = await shopifyApi.cart.addLines(cartId, [
					{ merchandiseId: selectedVariant.id, quantity },
				])
			} else {
				cart = await shopifyApi.cart.create([
					{ merchandiseId: selectedVariant.id, quantity },
				])
			}

			if (cart) {
				setCookie(createCartCookie(cart.id))
				navigate(`/${locale}/shop/cart`)
			}
		} catch {
			// Error handling - could show a toast
		} finally {
			setIsAddingToCart(false)
		}
	}

	function handleOptionChange(optionName: string, value: string) {
		setSelectedOptions((prev) => ({ ...prev, [optionName]: value }))
	}

	const hasMultipleOptions = product.options.some(
		(opt) => opt.values.length > 1,
	)

	// Prefer rich body content from Sanity, fall back to Shopify description
	const hasRichDescription = product.body && product.body.length > 0

	return (
		<main className={styles.main}>
			<div className={styles.container}>
				<Link to={`/${locale}/shop`} className={styles.backLink}>
					<Trans>{'\u2190'} Back to Shop</Trans>
				</Link>

				<div className={styles.productLayout}>
					<div className={styles.imageSection}>
						{mainImage && (
							<img
								src={mainImage.url}
								alt={mainImage.altText || product.title}
								className={styles.mainImage}
							/>
						)}
						{product.images.length > 1 && (
							<div className={styles.thumbnailGrid}>
								{product.images.slice(0, 4).map((image, index) => (
									<img
										key={image.id}
										src={image.url}
										alt={image.altText || `${product.title} ${index + 1}`}
										className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.thumbnailActive : ''}`}
										onClick={() => setSelectedImageIndex(index)}
									/>
								))}
							</div>
						)}
					</div>

					<div className={styles.detailsSection}>
						<h1 className={styles.title}>{product.title}</h1>

						<div>
							<span className={styles.price}>
								{selectedVariant
									? formatMoney(selectedVariant.price)
									: formatMoney(product.priceRange.minVariantPrice)}
							</span>
							{selectedVariant?.compareAtPrice && (
								<span className={styles.comparePrice}>
									{formatMoney(selectedVariant.compareAtPrice)}
								</span>
							)}
						</div>

						{hasRichDescription ? (
							<div className={styles.bodyContent}>
								<PortableText
									value={product.body!}
									components={portableTextComponents}
								/>
							</div>
						) : (
							product.description && (
								<p className={styles.description}>{product.description}</p>
							)
						)}

						{hasMultipleOptions &&
							product.options.map((option) => (
								<div key={option.name} className={styles.variantSection}>
									<span className={styles.variantLabel}>{option.name}</span>
									<div className={styles.variantOptions}>
										{option.values.map((value) => {
											const isSelected = selectedOptions[option.name] === value
											return (
												<button
													key={value}
													type="button"
													className={`${styles.variantOption} ${isSelected ? styles.variantOptionSelected : ''}`}
													onClick={() => handleOptionChange(option.name, value)}
												>
													{value}
												</button>
											)
										})}
									</div>
								</div>
							))}

						{product.availableForSale && selectedVariant?.availableForSale ? (
							<>
								<div className={styles.quantitySection}>
									<span className={styles.quantityLabel}>
										<Trans>Quantity</Trans>
									</span>
									<div className={styles.quantityControls}>
										<button
											type="button"
											className={styles.quantityButton}
											onClick={() => setQuantity((q) => Math.max(1, q - 1))}
											disabled={quantity <= 1}
											aria-label={t`Decrease quantity`}
										>
											-
										</button>
										<span className={styles.quantityValue}>{quantity}</span>
										<button
											type="button"
											className={styles.quantityButton}
											onClick={() => setQuantity((q) => q + 1)}
											aria-label={t`Increase quantity`}
										>
											+
										</button>
									</div>
								</div>

								<button
									type="button"
									className={styles.addToCartButton}
									onClick={handleAddToCart}
									disabled={isAddingToCart}
								>
									{isAddingToCart ? (
										<Trans>Adding...</Trans>
									) : (
										<Trans>Add to Cart</Trans>
									)}
								</button>
							</>
						) : (
							<div className={styles.soldOut}>
								<Trans>Sold Out</Trans>
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}

function findSelectedVariant(
	variants: ShopifyProductVariant[],
	selectedOptions: Record<string, string>,
): ShopifyProductVariant | undefined {
	return variants.find((variant) =>
		variant.selectedOptions.every(
			(opt) => selectedOptions[opt.name] === opt.value,
		),
	)
}
