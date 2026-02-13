import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Link } from 'react-router'

import coffeeExtractionImg from '@/assets/images/coffee-extraction.png'
import coffeeGroundsImg from '@/assets/images/coffee-grounds.png'
import drinksImg from '@/assets/images/drinks.png'
import icedLatteImg from '@/assets/images/iced-latte.png'
import insideImg from '@/assets/images/inside.png'
import { ProductCard } from '@/components/ProductCard'
import type { Locale } from '@/lib/locale'
import {
	urlFor,
	getLocalizedString,
	getLocalizedSlug,
	formatDate,
} from '@/lib/sanity'
import type { Location, Post } from '@/lib/sanity'
import type { MergedProduct } from '@/lib/shop-data'

import * as styles from './welcome.css'

const APP_STORE_URL =
	'https://apps.apple.com/app/tolo-buen-café/id6749597635' as const
const GOOGLE_PLAY_URL =
	'https://play.google.com/store/apps/details?id=cafe.tolo.app' as const

interface WelcomeProps {
	locale: Locale
	locations: Location[]
	message: string
	posts: Post[]
	products: MergedProduct[]
}

export function Welcome({ locale, locations, posts, products }: WelcomeProps) {
	const basePath = `/${locale}`
	const beansPath = locale === 'es' ? 'granos' : 'beans'
	const beansTo = `/${locale}/${beansPath}`
	const appTo = `${basePath}#app`

	const highlights = [
		{
			text: t`Something bold or something smooth? Tell us what you like and we'll help you choose. No fuss.`,
			title: t`Your coffee, your way`,
		},
		{
			text: t`We serve you quickly. Or order ahead on the app and just pick up.`,
			title: t`In a hurry?`,
		},
		{
			text: t`We roast every week, so there's always something fresh. Ask what's new or take a bag home.`,
			title: t`Always fresh`,
		},
		{
			text: t`Our Mexican coffees come straight from farms we know. We also rotate origins from Colombia, Ethiopia, Panama and more.`,
			title: t`Direct from the farm`,
		},
	] as const

	const trustItems = [
		{ label: t`100+ reviews`, value: '4.9★' },
		{ label: t`Roasted weekly`, value: t`Weekly` },
		{ label: t`Order ahead`, value: 'App' },
	]

	const menuItems = [
		t`Espresso drinks`,
		t`Pour overs`,
		t`Matcha`,
		t`Cold brew`,
		t`Chai`,
		t`Sweet bread`,
		t`Cacao`,
		t`Tea`,
	]

	return (
		<main className={styles.main}>
			{/* Hero Section */}
			<section className={styles.hero}>
				<div className={styles.heroVideo}>
					<iframe
						className={styles.heroVideoIframe}
						src="https://customer-jwnlj2lnbxh5it88.cloudflarestream.com/80c3111543efaccaf6f1d2d3120f4a77/iframe?muted=true&loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-jwnlj2lnbxh5it88.cloudflarestream.com%2F80c3111543efaccaf6f1d2d3120f4a77%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600&controls=false"
						loading="lazy"
						sandbox="allow-scripts"
						allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
						title="TOLO Coffee Hero Video"
					/>
				</div>
				<div className={styles.heroOverlay} />
				<div className={styles.heroContent}>
					<h1 className={styles.heroTitle}>
						<Trans>Good coffee, just like that.</Trans>
					</h1>
					<p className={styles.heroSubtitle}>
						<Trans>
							Specialty coffee, roasted weekly and made with care. Stop by for
							an espresso, stay to work for a bit, or just come to chat.
						</Trans>
					</p>

					<div className={styles.heroActions}>
						<Link to={appTo} className={styles.heroPrimaryButton}>
							<Trans>Download app</Trans>
						</Link>
						<Link
							to={`${basePath}/locations`}
							className={styles.heroSecondaryButton}
						>
							<Trans>Find a store</Trans>
						</Link>
					</div>
				</div>
			</section>

			{/* Quick Links */}
			<section className={styles.quickLinksSection}>
				<div className={styles.container}>
					<dl className={styles.trustBar}>
						{trustItems.map((item) => (
							<div key={item.label} className={styles.trustItem}>
								<dt className={styles.trustValue}>{item.value}</dt>
								<dd className={styles.trustLabel}>{item.label}</dd>
							</div>
						))}
					</dl>

					<div className={styles.quickLinksGrid}>
						<Link to={beansTo} className={styles.quickCard}>
							<img
								src={coffeeGroundsImg}
								alt=""
								className={styles.quickCardImage}
							/>
							<div className={styles.quickCardBody}>
								<h3 className={styles.quickCardTitle}>
									<Trans>Coffee beans</Trans>
								</h3>
								<p className={styles.quickCardText}>
									<Trans>
										Explore our coffee beans and take a bag home (in store).
									</Trans>
								</p>
								<span className={styles.quickCardCta}>
									<Trans>View beans</Trans> →
								</span>
							</div>
						</Link>
						<Link to={`${basePath}/locations`} className={styles.quickCard}>
							<img src={drinksImg} alt="" className={styles.quickCardImage} />
							<div className={styles.quickCardBody}>
								<h3 className={styles.quickCardTitle}>
									<Trans>Visit us</Trans>
								</h3>
								<p className={styles.quickCardText}>
									<Trans>
										A place to hang out or work: fast Wi-Fi, pet-friendly and
										good vibes.
									</Trans>
								</p>
								<span className={styles.quickCardCta}>
									<Trans>See locations</Trans> →
								</span>
							</div>
						</Link>
						<Link to={appTo} className={styles.quickCard}>
							<img
								src={icedLatteImg}
								alt=""
								className={styles.quickCardImage}
							/>
							<div className={styles.quickCardBody}>
								<h3 className={styles.quickCardTitle}>
									<Trans>Order with the app</Trans>
								</h3>
								<p className={styles.quickCardText}>
									<Trans>Order ahead and pick up, no lines.</Trans>
								</p>
								<span className={styles.quickCardCta}>
									<Trans>Download app</Trans> →
								</span>
							</div>
						</Link>
					</div>
				</div>
			</section>

			{/* About Section */}
			<section id="about" className={styles.sectionAnchor}>
				<div className={styles.container}>
					<div className={styles.aboutGrid}>
						<div className={styles.aboutTextBlock}>
							<h2 className={styles.sectionTitle}>
								<Trans>Hi, we are TOLO</Trans>
							</h2>
							<p className={styles.sectionText}>
								<Trans>
									At TOLO we make good coffee — that is it. We roast every week
									and prepare espresso, pour overs, matcha, cold brew, chai,
									cacao, tea and sweet bread. Want to take coffee home? We have
									bags of beans in store. For our Mexican coffees we work
									directly with farms we know, and we rotate origins like
									Colombia, Ethiopia and Panama.
								</Trans>
							</p>
						</div>
						<div className={styles.aboutImageBlock}>
							<img
								src={coffeeExtractionImg}
								alt=""
								className={styles.aboutImage}
							/>
						</div>
					</div>

					<div className={styles.highlightsGrid}>
						{highlights.map((item) => (
							<div key={item.title} className={styles.highlightCard}>
								<h3 className={styles.highlightTitle}>{item.title}</h3>
								<p className={styles.highlightText}>{item.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Menu Section */}
			<section id="menu" className={styles.sectionAnchor}>
				<div className={styles.sectionContent}>
					<h2 className={styles.sectionTitle}>
						<Trans>What is on the menu?</Trans>
					</h2>
					<div className={styles.chipGrid}>
						{menuItems.map((item) => (
							<span key={item} className={styles.chip}>
								{item}
							</span>
						))}
					</div>
					<p className={styles.sectionText}>
						<Trans>
							And if you want to take coffee home: beans available in store.
						</Trans>
					</p>
				</div>
			</section>

			{/* Shop Section */}
			{products.length > 0 && (
				<section className={styles.sectionAnchor}>
					<div className={styles.container}>
						<div className={styles.sectionHeader}>
							<h2 className={styles.sectionTitle}>
								<Trans>From our shop</Trans>
							</h2>
							<Link to={`${basePath}/shop`} className={styles.sectionLink}>
								<Trans>View all</Trans> →
							</Link>
						</div>
						<div className={styles.shopGrid}>
							{products.map((product) => (
								<Link
									key={product.id}
									to={`${basePath}/shop/${product.slug || product.handle}`}
									className={styles.shopCardLink}
								>
									<ProductCard product={product} />
								</Link>
							))}
						</div>
					</div>
				</section>
			)}

			{/* App Section */}
			<section id="app" className={styles.sectionAnchor}>
				<div className={styles.container}>
					<h2 className={styles.sectionTitle}>
						<Trans>Our app</Trans>
					</h2>
					<div className={styles.splitSection}>
						<div>
							<p className={styles.appText}>
								<Trans>
									Order your favorite coffee ahead and pick it up when you
									arrive, no waiting. Save your favorites, repeat previous
									orders in one tap and receive exclusive offers just for app
									users. The app is free and available for iOS and Android.
								</Trans>
							</p>
							<div className={styles.storeButtons}>
								<a
									href={APP_STORE_URL}
									target="_blank"
									rel="noreferrer"
									className={styles.storeButtonPrimary}
								>
									App Store
								</a>
								<a
									href={GOOGLE_PLAY_URL}
									target="_blank"
									rel="noreferrer"
									className={styles.storeButtonSecondary}
								>
									Google Play
								</a>
							</div>
						</div>
						<img src={insideImg} alt="" className={styles.appImage} />
					</div>
				</div>
			</section>

			{/* Stores Near You */}
			{locations.length > 0 && (
				<section id="visit" className={styles.sectionAnchor}>
					<div className={styles.container}>
						<div className={styles.sectionHeader}>
							<h2 className={styles.sectionTitle}>
								<Trans>Stores near you</Trans>
							</h2>
							<Link to={`${basePath}/locations`} className={styles.sectionLink}>
								<Trans>All locations</Trans> →
							</Link>
						</div>
						<div className={styles.carousel}>
							{locations.map((location) => {
								const slug = getLocalizedSlug(location.slug, locale)
								if (!slug) return null

								const name = getLocalizedString(
									location.name,
									locale,
									'Untitled',
								)
								const address = getLocalizedString(location.address, locale)
								const hours = getLocalizedString(location.hours, locale)
								const imageUrl = location.image
									? urlFor(location.image)?.width(600).height(400).url()
									: null

								return (
									<Link
										key={location._id}
										to={`${basePath}/locations/${slug}`}
										className={styles.carouselCard}
									>
										{imageUrl && (
											<img
												src={imageUrl}
												alt={location.image?.alt || name}
												className={styles.carouselCardImage}
											/>
										)}
										<div className={styles.carouselCardBody}>
											<div className={styles.carouselCardHeader}>
												<h3 className={styles.carouselCardTitle}>{name}</h3>
												{location.isUpcoming && (
													<span className={styles.upcomingBadge}>
														{t`Upcoming`}
													</span>
												)}
											</div>
											<p className={styles.carouselCardCity}>
												{location.city}, {location.country}
											</p>
											{address && (
												<p className={styles.carouselCardDetail}>{address}</p>
											)}
											{hours && (
												<p className={styles.carouselCardDetail}>{hours}</p>
											)}
										</div>
									</Link>
								)
							})}
						</div>
					</div>
				</section>
			)}

			{/* Blog Section */}
			{posts.length > 0 && (
				<section className={styles.sectionAnchor}>
					<div className={styles.container}>
						<div className={styles.sectionHeader}>
							<h2 className={styles.sectionTitle}>
								<Trans>From the blog</Trans>
							</h2>
							<Link to={`${basePath}/blog`} className={styles.sectionLink}>
								<Trans>Read more</Trans> →
							</Link>
						</div>
						<div className={styles.blogGrid}>
							{posts.map((post) => {
								const slug = getLocalizedSlug(post.slug, locale)
								if (!slug) return null

								const title = getLocalizedString(post.name, locale, 'Untitled')
								const imageUrl = post.image
									? urlFor(post.image)?.width(400).height(280).url()
									: null

								return (
									<Link
										key={post._id}
										to={`${basePath}/blog/${slug}`}
										className={styles.blogCard}
									>
										{imageUrl && (
											<img
												src={imageUrl}
												alt={post.image?.alt || title}
												className={styles.blogCardImage}
											/>
										)}
										<div className={styles.blogCardBody}>
											<h3 className={styles.blogCardTitle}>{title}</h3>
											{post.excerpt && (
												<p className={styles.blogCardExcerpt}>
													{getLocalizedString(post.excerpt, locale)}
												</p>
											)}
											<time className={styles.blogCardDate}>
												{formatDate(post.publishedAt, locale)}
											</time>
										</div>
									</Link>
								)
							})}
						</div>
					</div>
				</section>
			)}

			{/* Features Section */}
			<section className={styles.featuresSection}>
				<h2 className={styles.featuresSectionTitle}>
					<Trans>A bit more about us</Trans>
				</h2>
				<div className={styles.featuresGrid}>
					<div className={styles.featureCard}>
						<div className={styles.featureIcon}>
							<CoffeeIcon />
						</div>
						<h3 className={styles.featureTitle}>
							<Trans>Roasted weekly</Trans>
						</h3>
						<p className={styles.featureText}>
							<Trans>
								Always fresh coffee. We also sell bags of beans in store.
							</Trans>
						</p>
					</div>
					<div className={styles.featureCard}>
						<div className={styles.featureIcon}>
							<PrecisionIcon />
						</div>
						<h3 className={styles.featureTitle}>
							<Trans>People who know coffee</Trans>
						</h3>
						<p className={styles.featureText}>
							<Trans>
								Our team is SCA certified and always ready to help you find your
								coffee.
							</Trans>
						</p>
					</div>
					<div className={styles.featureCard}>
						<div className={styles.featureIcon}>
							<HeartIcon />
						</div>
						<h3 className={styles.featureTitle}>
							<Trans>A great community</Trans>
						</h3>
						<p className={styles.featureText}>
							<Trans>
								4.9★ with 100+ reviews (thank you!). Finalists in local
								competitions. A space to hang out or work.
							</Trans>
						</p>
					</div>
				</div>
			</section>
		</main>
	)
}

function CoffeeIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M17 8h1a4 4 0 1 1 0 8h-1" />
			<path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
			<line x1="6" x2="6" y1="2" y2="4" />
			<line x1="10" x2="10" y1="2" y2="4" />
			<line x1="14" x2="14" y1="2" y2="4" />
		</svg>
	)
}

function PrecisionIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<circle cx="12" cy="12" r="6" />
			<circle cx="12" cy="12" r="2" />
		</svg>
	)
}

function HeartIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
		</svg>
	)
}
