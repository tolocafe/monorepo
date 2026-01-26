import { Trans } from '@lingui/react/macro'
import {
	IconBrandFacebook,
	IconBrandInstagram,
	IconBrandTiktok,
	IconBrandTripadvisor,
} from '@tabler/icons-react'
import { Link, useParams } from 'react-router'

import AppStoreBadge from '@/assets/logos/app-store.svg'
import GooglePlayBadge from '@/assets/logos/google-play.svg'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { getLocalizedString, getLocalizedSlug } from '@/lib/sanity'
import type { Location } from '@/lib/sanity'

import * as styles from './Footer.css'

const currentYear = new Date().getFullYear()

// Path segments for localized URLs (not display text)
const LOCALE_PATHS = {
	de: {
		aboutPath: 'ueber-uns',
		beansPath: 'beans',
		privacyPath: 'datenschutz',
	},
	en: {
		aboutPath: 'about',
		beansPath: 'beans',
		privacyPath: 'privacy',
	},
	es: {
		aboutPath: 'nosotros',
		beansPath: 'granos',
		privacyPath: 'privacidad',
	},
	fr: {
		aboutPath: 'a-propos',
		beansPath: 'beans',
		privacyPath: 'confidentialite',
	},
	ja: {
		aboutPath: 'about',
		beansPath: 'beans',
		privacyPath: 'privacy',
	},
} as const

interface FooterProps {
	locations?: Location[]
}

export function Footer({ locations = [] }: FooterProps) {
	const { locale: localeParam } = useParams<{ locale: string }>()
	const locale: Locale = isValidLocale(localeParam)
		? localeParam
		: DEFAULT_LOCALE
	const paths = LOCALE_PATHS[locale]

	return (
		<footer className={styles.footer}>
			<div className={styles.container}>
				<div className={styles.brandSection}>
					<span className={styles.brand}>TOLO</span>
					<p className={styles.tagline}>
						<Trans>Good coffee, simple as that.</Trans>
					</p>
				</div>

				<div className={styles.linksGrid}>
					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>
							<Trans>Explore</Trans>
						</h3>
						<Link to={`/${locale}`} className={styles.link}>
							<Trans>Home</Trans>
						</Link>
						<Link to={`/${locale}/${paths.beansPath}`} className={styles.link}>
							<Trans>Our Beans</Trans>
						</Link>
						<Link to={`/${locale}/blog`} className={styles.link}>
							<Trans>Blog</Trans>
						</Link>
					</div>

					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>
							<Trans>Company</Trans>
						</h3>
						<Link to={`/${locale}/${paths.aboutPath}`} className={styles.link}>
							<Trans>About</Trans>
						</Link>
						<Link to={`/${locale}/shop`} className={styles.link}>
							<Trans>Store</Trans>
						</Link>
						<Link to={`/${locale}/contact`} className={styles.link}>
							<Trans>Contact</Trans>
						</Link>
					</div>

					{locations.length > 0 && (
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>
								<Trans>Locations</Trans>
							</h3>
							{locations.map((loc) => {
								const slug = getLocalizedSlug(loc.slug, locale)
								return slug ? (
									<Link
										key={loc._id}
										to={`/${locale}/locations/${slug}`}
										className={styles.link}
									>
										{getLocalizedString(loc.name, locale)}
									</Link>
								) : null
							})}
						</div>
					)}

					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>
							<Trans>Download</Trans>
						</h3>
						<div className={styles.storeLinks}>
							<a
								href="https://apps.apple.com/app/tolo-cafe/id6503702880"
								target="_blank"
								rel="noreferrer"
								className={styles.storeLink}
							>
								<img
									src={AppStoreBadge}
									alt="Download on the App Store"
									className={styles.storeBadge}
								/>
							</a>
							<a
								href="https://play.google.com/store/apps/details?id=cafe.tolo.app"
								target="_blank"
								rel="noreferrer"
								className={styles.storeLink}
							>
								<img
									src={GooglePlayBadge}
									alt="Get it on Google Play"
									className={styles.storeBadge}
								/>
							</a>
						</div>
					</div>
				</div>
			</div>

			<div className={styles.bottomBar}>
				<p className={styles.copyright}>
					<Trans>© {currentYear} TOLO. All rights reserved.</Trans>
				</p>

				<div className={styles.socialLinks}>
					<a
						href="https://instagram.com/tolo.cafe"
						target="_blank"
						rel="noreferrer"
						className={styles.socialLink}
						aria-label="Instagram"
					>
						<IconBrandInstagram size={24} aria-hidden="true" />
					</a>
					<a
						href="https://facebook.com/tolo.cafe"
						target="_blank"
						rel="noreferrer"
						className={styles.socialLink}
						aria-label="Facebook"
					>
						<IconBrandFacebook size={24} aria-hidden="true" />
					</a>
					<a
						href="https://tiktok.com/@tolo.cafe"
						target="_blank"
						rel="noreferrer"
						className={styles.socialLink}
						aria-label="TikTok"
					>
						<IconBrandTiktok size={24} aria-hidden="true" />
					</a>
					<a
						href="https://www.tripadvisor.com/Restaurant_Review-g644384-d33287081-Reviews-TOLO_Buen_Cafe-Toluca_Central_Mexico_and_Gulf_Coast.html"
						target="_blank"
						rel="noreferrer"
						className={styles.socialLink}
						aria-label="TripAdvisor"
					>
						<IconBrandTripadvisor size={24} aria-hidden="true" />
					</a>
					<Link
						to={`/${locale}/${paths.privacyPath}`}
						className={styles.legalLink}
					>
						<Trans>Privacy</Trans>
					</Link>
				</div>
			</div>
		</footer>
	)
}
