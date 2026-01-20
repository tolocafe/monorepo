import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import toloLogo from '~/assets/tolo.png'
import {
	SUPPORTED_LOCALES,
	LOCALE_LABELS,
	getPathWithoutLocale,
	isValidLocale,
	DEFAULT_LOCALE,
} from '~/lib/locale'
import type { Locale } from '~/lib/locale'

import * as styles from './Header.css'

const TRANSLATIONS = {
	de: {
		about: 'Über uns',
		aboutPath: 'ueber-uns',
		beans: 'Bohnen',
		beansPath: 'beans',
		blog: 'Blog',
		closeMenu: 'Menü schließen',
		contact: 'Kontakt',
		ctaApp: 'App herunterladen',
		menuTitle: 'Menü',
		openMenu: 'Menü öffnen',
		visit: 'Besuchen',
	},
	en: {
		about: 'About',
		aboutPath: 'about',
		beans: 'Beans',
		beansPath: 'beans',
		blog: 'Blog',
		closeMenu: 'Close menu',
		contact: 'Contact',
		ctaApp: 'Get the app',
		menuTitle: 'Menu',
		openMenu: 'Open menu',
		visit: 'Visit',
	},
	es: {
		about: 'Nosotros',
		aboutPath: 'nosotros',
		beans: 'Granos',
		beansPath: 'granos',
		blog: 'Blog',
		closeMenu: 'Cerrar menú',
		contact: 'Contacto',
		ctaApp: 'Descargar app',
		menuTitle: 'Menú',
		openMenu: 'Abrir menú',
		visit: 'Visítanos',
	},
	fr: {
		about: 'À propos',
		aboutPath: 'a-propos',
		beans: 'Grains',
		beansPath: 'beans',
		blog: 'Blog',
		closeMenu: 'Fermer le menu',
		contact: 'Contact',
		ctaApp: 'Télécharger l’app',
		menuTitle: 'Menu',
		openMenu: 'Ouvrir le menu',
		visit: 'Nous trouver',
	},
	ja: {
		about: '私たちについて',
		aboutPath: 'about',
		beans: '豆',
		beansPath: 'beans',
		blog: 'ブログ',
		closeMenu: 'メニューを閉じる',
		contact: 'お問い合わせ',
		ctaApp: 'アプリを入手',
		menuTitle: 'メニュー',
		openMenu: 'メニューを開く',
		visit: '店舗情報',
	},
} as const

export function Header() {
	const { locale: localeParam } = useParams<{ locale: string }>()
	const location = useLocation()
	const navigate = useNavigate()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const currentLocale: Locale = isValidLocale(localeParam)
		? localeParam
		: DEFAULT_LOCALE
	const pathWithoutLocale = getPathWithoutLocale(location.pathname)
	const t = TRANSLATIONS[currentLocale] || TRANSLATIONS.es

	const beansTo = `/${currentLocale}/${t.beansPath}`
	const blogTo = `/${currentLocale}/blog`
	const aboutTo = `/${currentLocale}/${t.aboutPath}`
	const visitTo = `/${currentLocale}#visit`
	const contactTo = `/${currentLocale}/contact`
	const appTo = `/${currentLocale}#app`

	const navItems = [
		{ label: t.beans, matchPath: beansTo, to: beansTo },
		{ label: t.blog, matchPath: blogTo, to: blogTo },
		{ label: t.about, matchPath: aboutTo, to: aboutTo },
		{
			label: t.visit,
			matchHash: '#visit',
			matchPath: `/${currentLocale}`,
			to: visitTo,
		},
		{
			label: t.contact,
			matchPath: contactTo,
			to: contactTo,
		},
	] as const

	function isActive(item: (typeof navItems)[number]) {
		if (!location.pathname.startsWith(item.matchPath)) return false
		if (
			'matchHash' in item &&
			item.matchHash &&
			location.hash !== item.matchHash
		)
			return false
		return true
	}

	function handleLocaleChange(event: React.ChangeEvent<HTMLSelectElement>) {
		const newLocale = event.target.value as Locale
		const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
		navigate(newPath)
	}

	useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [location.pathname, location.hash, currentLocale])

	useEffect(() => {
		if (!isMobileMenuOpen) return

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') setIsMobileMenuOpen(false)
		}

		globalThis.addEventListener('keydown', onKeyDown)
		return () => globalThis.removeEventListener('keydown', onKeyDown)
	}, [isMobileMenuOpen])

	return (
		<header className={styles.header}>
			<div className={styles.inner}>
				<div className={styles.left}>
					<nav className={styles.nav} aria-label="Primary">
						<Link to={`/${currentLocale}`} className={styles.logo}>
							<img src={toloLogo} alt="TOLO" className={styles.logoImg} />
						</Link>
					</nav>

					<nav className={styles.links} aria-label="Site">
						{navItems.map((item) => (
							<Link
								key={item.to}
								to={item.to}
								className={`${styles.link} ${isActive(item) ? styles.linkActive : ''}`}
							>
								{item.label}
							</Link>
						))}
					</nav>
				</div>

				<div className={styles.right}>
					<Link to={appTo} className={styles.cta}>
						{t.ctaApp}
					</Link>

					<nav className={styles.localeNav} aria-label="Language selection">
						<select
							className={styles.localeSelect}
							value={currentLocale}
							onChange={handleLocaleChange}
							aria-label="Select language"
						>
							{SUPPORTED_LOCALES.map((locale) => (
								<option key={locale} value={locale}>
									{LOCALE_LABELS[locale]}
								</option>
							))}
						</select>
					</nav>

					<button
						type="button"
						className={styles.menuButton}
						onClick={() => setIsMobileMenuOpen(true)}
						aria-label={t.openMenu}
						aria-expanded={isMobileMenuOpen}
						aria-controls="mobile-menu"
					>
						<MenuIcon />
					</button>
				</div>
			</div>

			{isMobileMenuOpen && (
				<>
					<div
						className={styles.mobileOverlay}
						onClick={() => setIsMobileMenuOpen(false)}
					/>
					<div
						id="mobile-menu"
						className={styles.mobilePanel}
						role="dialog"
						aria-modal="true"
						aria-label={t.menuTitle}
					>
						<div className={styles.mobileHeader}>
							<span className={styles.mobileTitle}>TOLO</span>
							<button
								type="button"
								className={styles.mobileClose}
								onClick={() => setIsMobileMenuOpen(false)}
								aria-label={t.closeMenu}
							>
								<CloseIcon />
							</button>
						</div>

						<nav className={styles.mobileLinks} aria-label="Site">
							{navItems.map((item) => (
								<Link key={item.to} to={item.to} className={styles.mobileLink}>
									{item.label}
								</Link>
							))}
						</nav>

						<Link to={appTo} className={styles.mobileCta}>
							{t.ctaApp}
						</Link>
					</div>
				</>
			)}
		</header>
	)
}

function MenuIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<line x1="4" x2="20" y1="6" y2="6" />
			<line x1="4" x2="20" y1="12" y2="12" />
			<line x1="4" x2="20" y1="18" y2="18" />
		</svg>
	)
}

function CloseIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	)
}
