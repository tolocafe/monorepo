import { Link, useParams } from 'react-router'

import { isValidLocale, DEFAULT_LOCALE } from '@/lib/locale'
import type { Locale } from '@/lib/locale'
import { getLocalizedString, getLocalizedSlug } from '@/lib/sanity'
import type { Location } from '@/lib/sanity'

import * as styles from './Footer.css'

const currentYear = new Date().getFullYear()

const TRANSLATIONS = {
	de: {
		about: 'Über uns',
		aboutPath: 'ueber-uns',
		beans: 'Unsere Bohnen',
		beansPath: 'beans',
		blog: 'Blog',
		brand: 'TOLO',
		company: 'Unternehmen',
		connect: 'Folgen Sie uns',
		contact: 'Kontakt',
		copyright: `© ${currentYear} TOLO. Alle Rechte vorbehalten.`,
		explore: 'Erkunden',
		home: 'Startseite',
		legal: 'Rechtliches',
		locations: 'Standorte',
		privacy: 'Datenschutz',
		privacyPath: 'datenschutz',
		tagline: 'Guter Kaffee, nichts weiter.',
		wholesale: 'Großhandel',
		wholesalePath: 'grosshandel',
	},
	en: {
		about: 'About Us',
		aboutPath: 'about',
		beans: 'Our Beans',
		beansPath: 'beans',
		blog: 'Blog',
		brand: 'TOLO',
		company: 'Company',
		connect: 'Follow Us',
		contact: 'Contact',
		copyright: `© ${currentYear} TOLO. All rights reserved.`,
		explore: 'Explore',
		home: 'Home',
		legal: 'Legal',
		locations: 'Locations',
		privacy: 'Privacy',
		privacyPath: 'privacy',
		tagline: 'Good coffee, nothing more.',
		wholesale: 'Wholesale',
		wholesalePath: 'wholesale',
	},
	es: {
		about: 'Nosotros',
		aboutPath: 'nosotros',
		beans: 'Nuestros Granos',
		beansPath: 'granos',
		blog: 'Blog',
		brand: 'TOLO',
		company: 'Empresa',
		connect: 'Síguenos',
		contact: 'Contacto',
		copyright: `© ${currentYear} TOLO. Todos los derechos reservados.`,
		explore: 'Explorar',
		home: 'Inicio',
		legal: 'Legal',
		locations: 'Ubicaciones',
		privacy: 'Privacidad',
		privacyPath: 'privacidad',
		tagline: 'Buen café, así nomás.',
		wholesale: 'Mayoreo',
		wholesalePath: 'mayoreo',
	},
	fr: {
		about: 'À propos',
		aboutPath: 'a-propos',
		beans: 'Nos Grains',
		beansPath: 'beans',
		blog: 'Blog',
		brand: 'TOLO',
		company: 'Entreprise',
		connect: 'Suivez-nous',
		contact: 'Contact',
		copyright: `© ${currentYear} TOLO. Tous droits réservés.`,
		explore: 'Explorer',
		home: 'Accueil',
		legal: 'Légal',
		locations: 'Emplacements',
		privacy: 'Confidentialité',
		privacyPath: 'confidentialite',
		tagline: 'Du bon café, rien de plus.',
		wholesale: 'Vente en gros',
		wholesalePath: 'vente-en-gros',
	},
	ja: {
		about: '私たちについて',
		aboutPath: 'about',
		beans: 'コーヒー豆',
		beansPath: 'beans',
		blog: 'ブログ',
		brand: 'TOLO',
		company: '会社情報',
		connect: 'フォロー',
		contact: 'お問い合わせ',
		copyright: `© ${currentYear} TOLO. 全著作権所有。`,
		explore: '探索',
		home: 'ホーム',
		legal: '法的情報',
		locations: '店舗',
		privacy: 'プライバシー',
		privacyPath: 'privacy',
		tagline: 'シンプルに、おいしいコーヒー。',
		wholesale: '卸売',
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
	const t = TRANSLATIONS[locale]

	return (
		<footer className={styles.footer}>
			<div className={styles.container}>
				<div className={styles.brandSection}>
					<span className={styles.brand}>{t.brand}</span>
					<p className={styles.tagline}>{t.tagline}</p>
				</div>

				<div className={styles.linksGrid}>
					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>{t.explore}</h3>
						<Link to={`/${locale}`} className={styles.link}>
							{t.home}
						</Link>
						<Link to={`/${locale}/${t.beansPath}`} className={styles.link}>
							{t.beans}
						</Link>
						<Link to={`/${locale}/blog`} className={styles.link}>
							{t.blog}
						</Link>
					</div>

					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>{t.company}</h3>
						<Link to={`/${locale}/${t.aboutPath}`} className={styles.link}>
							{t.about}
						</Link>
						<Link to={`/${locale}/${t.wholesalePath}`} className={styles.link}>
							{t.wholesale}
						</Link>
						<Link to={`/${locale}/contact`} className={styles.link}>
							{t.contact}
						</Link>
					</div>

					{locations.length > 0 && (
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>{t.locations}</h3>
							{locations.map((location) => {
								const slug = getLocalizedSlug(location.slug, locale)
								return slug ? (
									<Link
										key={location._id}
										to={`/${locale}/locations/${slug}`}
										className={styles.link}
									>
										{getLocalizedString(location.name, locale)}
									</Link>
								) : null
							})}
						</div>
					)}

					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>{t.connect}</h3>
						<a
							href="https://instagram.com/tolo.cafe"
							target="_blank"
							rel="noreferrer"
							className={styles.link}
						>
							Instagram
						</a>
						<a
							href="https://facebook.com/tolo.cafe"
							target="_blank"
							rel="noreferrer"
							className={styles.link}
						>
							Facebook
						</a>
						<a
							href="https://tiktok.com/@tolo.cafe"
							target="_blank"
							rel="noreferrer"
							className={styles.link}
						>
							TikTok
						</a>
					</div>
				</div>
			</div>

			<div className={styles.bottomBar}>
				<p className={styles.copyright}>{t.copyright}</p>
				<div className={styles.legalLinks}>
					<Link to={`/${locale}/${t.privacyPath}`} className={styles.legalLink}>
						{t.privacy}
					</Link>
				</div>
			</div>
		</footer>
	)
}
