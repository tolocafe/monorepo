/// <reference types="vite-plugin-svgr/client" />

import { Trans } from '@lingui/react/macro'
import { Link, useParams } from 'react-router'

import AppStoreBadge from '@/assets/logos/app-store.svg'
import FacebookLogo from '@/assets/logos/facebook.svg?react'
import GooglePlayBadge from '@/assets/logos/google-play.svg'
import InstagramLogo from '@/assets/logos/instagram.svg?react'
import TikTokLogo from '@/assets/logos/tiktok.svg?react'
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
		investorsPath: 'investoren',
		privacyPath: 'datenschutz',
		wholesalePath: 'grosshandel',
	},
	en: {
		aboutPath: 'about',
		beansPath: 'beans',
		investorsPath: 'investors',
		privacyPath: 'privacy',
		wholesalePath: 'wholesale',
	},
	es: {
		aboutPath: 'nosotros',
		beansPath: 'granos',
		investorsPath: 'inversionistas',
		privacyPath: 'privacidad',
		wholesalePath: 'mayoreo',
	},
	fr: {
		aboutPath: 'a-propos',
		beansPath: 'beans',
		investorsPath: 'investisseurs',
		privacyPath: 'confidentialite',
		wholesalePath: 'vente-en-gros',
	},
	ja: {
		aboutPath: 'about',
		beansPath: 'beans',
		investorsPath: 'investors',
		privacyPath: 'privacy',
		wholesalePath: 'wholesale',
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
						<Link
							to={`/${locale}/${paths.wholesalePath}`}
							className={styles.link}
						>
							<Trans>Wholesale</Trans>
						</Link>
						<Link to={`/${locale}/contact`} className={styles.link}>
							<Trans>Contact</Trans>
						</Link>
						<Link
							to={`/${locale}/${paths.investorsPath}`}
							className={styles.link}
						>
							<Trans>Investors</Trans>
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
							<Trans>Download the App</Trans>
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
					>
						<InstagramLogo className={styles.socialIcon} title="Instagram" />
					</a>
					<a
						href="https://facebook.com/tolo.cafe"
						target="_blank"
						rel="noreferrer"
						className={styles.socialLink}
					>
						<FacebookLogo className={styles.socialIcon} title="Facebook" />
					</a>
					<a
						href="https://tiktok.com/@tolo.cafe"
						target="_blank"
						rel="noreferrer"
						className={styles.socialLink}
					>
						<TikTokLogo className={styles.socialIcon} title="TikTok" />
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
