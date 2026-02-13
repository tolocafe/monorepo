import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Link } from 'react-router'

import appImg from '@/assets/images/app.png'
import coffeeGroundsImg from '@/assets/images/coffee-beans.jpg'
import coffeeExtractionImg from '@/assets/images/coffee-extraction.png'
import drinksImg from '@/assets/images/drinks.png'
import orderWithApp from '@/assets/images/order-app.jpg'
import appStoreBadge from '@/assets/logos/app-store.svg'
import googlePlayBadge from '@/assets/logos/google-play.svg'
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

	const features = [
		{
			text: t`We roast in small batches every week. Your coffee is never more than a few days old.`,
			title: t`Roasted weekly`,
		},
		{
			text: t`Our team is SCA certified and always ready to help you find your coffee.`,
			title: t`People who know coffee`,
		},
		{
			text: t`4.9★ with 150+ reviews — thank you! A place to hang out, work, or just enjoy your morning coffee.`,
			title: t`A great community`,
		},
	] as const

	const trustItems = [
		{ label: t`150+ reviews`, value: '4.9★' },
		{ label: t`Roasted weekly`, value: t`Weekly` },
		{ label: t`Order ahead`, value: 'App' },
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

					<dl className={styles.heroTrustBar}>
						{trustItems.map((item) => (
							<div key={item.label} className={styles.heroTrustItem}>
								<dt className={styles.heroTrustValue}>{item.value}</dt>
								<dd className={styles.heroTrustLabel}>{item.label}</dd>
							</div>
						))}
					</dl>
				</div>
			</section>

			{/* Quick Links */}
			<section className={styles.quickLinksSection}>
				<div className={styles.container}>
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
										Fresh roasted beans to brew at home. Available at our cafés.
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
								src={orderWithApp}
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
							<p>
								<Trans>
									At TOLO we make good coffee — that is it. We roast every week,
									work directly with farms we know in Mexico, and rotate origins
									like Colombia, Ethiopia and Panama. Espresso, pour overs,
									matcha, cold brew, chai and sweet bread — grab a bag of beans
									on your way out.
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

					<div className={styles.featuresGrid}>
						{features.map((item) => (
							<div key={item.title} className={styles.featureCard}>
								<h3 className={styles.featureTitle}>{item.title}</h3>
								<p className={styles.featureText}>{item.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Shop Section */}
			{products.length > 0 && (
				<section className={styles.sectionAnchor}>
					<div className={styles.container}>
						<div className={styles.sectionHeader}>
							<div className={styles.sectionHeaderText}>
								<h2>
									<Trans>From our shop</Trans>
								</h2>
								<p className={styles.sectionDescription}>
									<Trans>
										Brewing gear, merch and more — everything you need to make
										great coffee at home.
									</Trans>
								</p>
							</div>
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
					<div className={styles.splitSection}>
						<div>
							<h2 className={styles.sectionTitle}>
								<Trans>Your coffee, ready when you are</Trans>
							</h2>
							<p className={styles.appText}>
								<Trans>
									Skip the line — order ahead and pick up when you arrive. Save
									your favorites, reorder in one tap and get exclusive offers.
									Free on iOS and Android.
								</Trans>
							</p>
							<div className={styles.storeButtons}>
								<a href={APP_STORE_URL} target="_blank" rel="noreferrer">
									<img
										src={appStoreBadge}
										alt="Download on the App Store"
										className={styles.storeBadge}
									/>
								</a>
								<a href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer">
									<img
										src={googlePlayBadge}
										alt="Get it on Google Play"
										className={styles.storeBadge}
									/>
								</a>
							</div>
						</div>
						<img src={appImg} alt="" className={styles.appImage} />
					</div>
				</div>
			</section>

			{/* Stores Near You */}
			{locations.length > 0 && (
				<section id="visit" className={styles.sectionAnchor}>
					<div className={styles.container}>
						<div className={styles.sectionHeader}>
							<div className={styles.sectionHeaderText}>
								<h2>
									<Trans>Stores near you</Trans>
								</h2>
								<p className={styles.sectionDescription}>
									<Trans>
										Fast Wi-Fi, pet-friendly and good vibes. Drop by any of our
										locations.
									</Trans>
								</p>
							</div>
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
												alt={getLocalizedString(
													location.image?.alt,
													locale,
													name,
												)}
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
							<div className={styles.sectionHeaderText}>
								<h2>
									<Trans>From the blog</Trans>
								</h2>
								<p className={styles.sectionDescription}>
									<Trans>
										Stories about coffee, origins and what we have been up to
										lately.
									</Trans>
								</p>
							</div>
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
									? urlFor(post.image)?.width(600).height(340).url()
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
												alt={getLocalizedString(post.image?.alt, locale, title)}
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
		</main>
	)
}
