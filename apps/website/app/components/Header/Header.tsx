import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { IconMenu2, IconWorld, IconX } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import toloLogo from '@/assets/tolo.png'
import { CartIcon } from '@/components/CartIcon'
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
	de: { aboutPath: 'ueber-uns' },
	en: { aboutPath: 'about' },
	es: { aboutPath: 'nosotros' },
	fr: { aboutPath: 'a-propos' },
	ja: { aboutPath: 'about' },
} as const

export function Header() {
	const { locale: localeParam } = useParams<{ locale: string }>()
	const location = useLocation()
	const navigate = useNavigate()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false)
	const localeMenuRef = useRef<HTMLDivElement>(null)

	const currentLocale: Locale = isValidLocale(localeParam)
		? localeParam
		: DEFAULT_LOCALE
	const pathWithoutLocale = getPathWithoutLocale(location.pathname)
	const paths = LOCALE_PATHS[currentLocale] || LOCALE_PATHS.es

	const shopTo = `/${currentLocale}/shop`
	const locationsTo = `/${currentLocale}/locations`
	const aboutTo = `/${currentLocale}/${paths.aboutPath}`

	const navItems = [
		{ label: t`Shop`, matchPath: shopTo, to: shopTo },
		{ label: t`Visit`, matchPath: locationsTo, to: locationsTo },
		{ label: t`About`, matchPath: aboutTo, to: aboutTo },
	] as const

	function isActive(item: (typeof navItems)[number]) {
		return location.pathname.startsWith(item.matchPath)
	}

	function handleLocaleSelect(newLocale: Locale) {
		const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
		navigate(newPath)
		setIsLocaleMenuOpen(false)
	}

	useEffect(() => {
		setIsMobileMenuOpen(false)
		setIsLocaleMenuOpen(false)
	}, [location.pathname, currentLocale])

	useEffect(() => {
		if (!isLocaleMenuOpen) return

		function handleClickOutside(event: MouseEvent) {
			if (
				localeMenuRef.current &&
				!localeMenuRef.current.contains(event.target as Node)
			) {
				setIsLocaleMenuOpen(false)
			}
		}

		function handleEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') setIsLocaleMenuOpen(false)
		}

		globalThis.addEventListener('mousedown', handleClickOutside)
		globalThis.addEventListener('keydown', handleEscape)
		return () => {
			globalThis.removeEventListener('mousedown', handleClickOutside)
			globalThis.removeEventListener('keydown', handleEscape)
		}
	}, [isLocaleMenuOpen])

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
					<a
						href="https://app.tolo.cafe"
						className={styles.headerCta}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Trans>Order</Trans>
					</a>
					<CartIcon />

					<div
						className={styles.localeNav}
						ref={localeMenuRef}
						aria-label="Language selection"
					>
						<button
							type="button"
							className={styles.localeButton}
							onClick={() => setIsLocaleMenuOpen(!isLocaleMenuOpen)}
							aria-expanded={isLocaleMenuOpen}
							aria-haspopup="true"
							aria-label={t`Select language, current: ${LOCALE_LABELS[currentLocale]}`}
						>
							<IconWorld size={20} aria-hidden="true" />
						</button>
						{isLocaleMenuOpen && (
							<div className={styles.localeDropdown} role="menu">
								{SUPPORTED_LOCALES.map((locale) => (
									<button
										key={locale}
										type="button"
										role="menuitem"
										className={`${styles.localeOption} ${locale === currentLocale ? styles.localeOptionActive : ''}`}
										onClick={() => handleLocaleSelect(locale)}
									>
										{LOCALE_LABELS[locale]}
									</button>
								))}
							</div>
						)}
					</div>

					<button
						type="button"
						className={styles.menuButton}
						onClick={() => setIsMobileMenuOpen(true)}
						aria-label={t`Open menu`}
						aria-expanded={isMobileMenuOpen}
						aria-controls="mobile-menu"
					>
						<IconMenu2 size={18} aria-hidden="true" />
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
								<IconX size={18} aria-hidden="true" />
							</button>
						</div>

						<nav className={styles.mobileLinks} aria-label="Site">
							{navItems.map((item) => (
								<Link key={item.to} to={item.to} className={styles.mobileLink}>
									{item.label}
								</Link>
							))}
						</nav>
					</div>
				</>
			)}
		</header>
	)
}
