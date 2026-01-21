import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import toloLogo from '@/assets/tolo.png'
import {
	SUPPORTED_LOCALES,
	LOCALE_LABELS,
	getPathWithoutLocale,
	isValidLocale,
	DEFAULT_LOCALE,
} from '@/lib/locale'
import type { Locale } from '@/lib/locale'

import * as styles from './Header.css'

// Path segments for localized URLs (not display text)
const LOCALE_PATHS = {
	de: { aboutPath: 'ueber-uns', beansPath: 'beans' },
	en: { aboutPath: 'about', beansPath: 'beans' },
	es: { aboutPath: 'nosotros', beansPath: 'granos' },
	fr: { aboutPath: 'a-propos', beansPath: 'beans' },
	ja: { aboutPath: 'about', beansPath: 'beans' },
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
	const paths = LOCALE_PATHS[currentLocale] || LOCALE_PATHS.es

	const beansTo = `/${currentLocale}/${paths.beansPath}`
	const blogTo = `/${currentLocale}/blog`
	const aboutTo = `/${currentLocale}/${paths.aboutPath}`
	const visitTo = `/${currentLocale}#visit`
	const contactTo = `/${currentLocale}/contact`
	const appTo = `/${currentLocale}#app`

	const navItems = [
		{ label: t`Beans`, matchPath: beansTo, to: beansTo },
		{ label: t`Blog`, matchPath: blogTo, to: blogTo },
		{ label: t`About`, matchPath: aboutTo, to: aboutTo },
		{
			label: t`Visit`,
			matchHash: '#visit',
			matchPath: `/${currentLocale}`,
			to: visitTo,
		},
		{
			label: t`Contact`,
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
						<Trans>Download app</Trans>
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
						aria-label={t`Open menu`}
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
						aria-label={t`Menu`}
					>
						<div className={styles.mobileHeader}>
							<span className={styles.mobileTitle}>TOLO</span>
							<button
								type="button"
								className={styles.mobileClose}
								onClick={() => setIsMobileMenuOpen(false)}
								aria-label={t`Close menu`}
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
							<Trans>Download app</Trans>
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
