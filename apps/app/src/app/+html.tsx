// Initialize Unistyles for web static rendering
import '~/lib/styles/unistyles'
import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'

export default function Root({ children }: PropsWithChildren) {
	return (
		<html lang="es">
			<head>
				<meta charSet="utf-8" />
				<meta content="IE=edge" httpEquiv="X-UA-Compatible" />
				<meta
					content="width=device-width, initial-scale=1, shrink-to-fit=no"
					name="viewport"
				/>

				<link
					href="https://o4509792904151040.ingest.us.sentry.io"
					rel="dns-prefetch"
				/>
				<link href="https://a.tolo.cafe" rel="dns-prefetch" />

				{/* SEO and Performance Meta Tags */}
				<meta
					content="#3D6039"
					media="(prefers-color-scheme: light)"
					name="theme-color"
				/>
				<meta
					content="#151718"
					media="(prefers-color-scheme: dark)"
					name="theme-color"
				/>
				<meta content="light dark" name="color-scheme" />
				<meta content="index, follow" name="robots" />
				<meta content="no-referrer-when-downgrade" name="referrer" />
				<meta content="nosniff" httpEquiv="X-Content-Type-Options" />
				<meta content="Expo" name="generator" />

				{/* PWA Capabilities */}
				<meta content="yes" name="mobile-web-app-capable" />
				<meta content="TOLO" name="application-name" />

				{/* Apple-Specific Meta Tags */}
				<meta content="yes" name="apple-mobile-web-app-capable" />
				<meta
					content="black-translucent"
					name="apple-mobile-web-app-status-bar-style"
				/>
				<meta content="TOLO" name="apple-mobile-web-app-title" />
				<meta content="telephone=no" name="format-detection" />

				{/* Icons - Multiple sizes for better display */}
				<link href="/icon.png" rel="apple-touch-icon" sizes="512x512" />
				<link href="/favicon.png" rel="icon" sizes="192x192" type="image/png" />
				<link href="/manifest.json" rel="manifest" />
				<link href="https://app.tolo.cafe" rel="canonical" />

				{/* Default SEO - can be overridden per page */}
				<meta
					content="Tu cafetería dónde se sirve buen café, así nomás"
					name="description"
				/>
				<meta
					content="TOLO, buen café, cafetería, espresso, latte, cappuccino, café de barrio, café casero"
					name="keywords"
				/>
				<meta content="TOLO Coffee Shop" name="author" />

				{/* Open Graph Meta Tags */}
				<meta content="website" property="og:type" />
				<meta content="TOLO Coffee Shop" property="og:site_name" />
				<meta content="TOLO - Buen Café" property="og:title" />
				<meta
					content="Tu cafetería dónde se sirve buen café, así nomás"
					property="og:description"
				/>
				<meta content="https://app.tolo.cafe" property="og:url" />
				<meta content="/og-image.png" property="og:image" />
				<meta
					content="https://app.tolo.cafe/og-image.png"
					property="og:image:secure_url"
				/>
				<meta content="image/png" property="og:image:type" />
				<meta content="1200" property="og:image:width" />
				<meta content="630" property="og:image:height" />
				<meta content="Logo de TOLO Buen Café" property="og:image:alt" />
				<meta content="es_MX" property="og:locale" />
				<meta content="en_US" property="og:locale:alternate" />

				{/* Twitter Card Meta Tags */}
				<meta content="summary_large_image" name="twitter:card" />
				<meta content="TOLO - Buen Café" name="twitter:title" />
				<meta
					content="Tu cafetería dónde se sirve buen café, así nomás"
					name="twitter:description"
				/>
				<meta content="/og-image.png" name="twitter:image" />
				<meta content="Logo de TOLO Buen Café" name="twitter:image:alt" />

				{/* App Store Smart Banners */}
				<meta content="app-id=6749597635" name="apple-itunes-app" />
				<meta content="app-id=cafe.tolo.app" name="google-play-app" />

				{/* Structured Data for SEO */}
				<script
					// oxlint-disable-next-line no-danger
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@id': 'https://app.tolo.cafe',
							'@type': ['LocalBusiness', 'CafeOrCoffeeShop'],
							description: 'Tu cafetería dónde se sirve buen café, así nomás',
							hasMenu: {
								'@type': 'Menu',
								hasMenuSection: {
									'@type': 'MenuSection',
									name: 'Menu',
									url: 'https://app.tolo.cafe/',
								},
							},
							image: 'https://app.tolo.cafe/og-image.png',
							logo: 'https://app.tolo.cafe/icon.png',
							name: 'TOLO - Buen Café',
							potentialAction: {
								'@type': 'OrderAction',
								target: {
									'@type': 'EntryPoint',
									actionPlatform: [
										'http://schema.org/DesktopWebPlatform',
										'http://schema.org/MobileWebPlatform',
										'http://schema.org/IOSPlatform',
										'http://schema.org/AndroidPlatform',
									],
									urlTemplate: 'https://app.tolo.cafe',
								},
							},
							priceRange: '$$',
							sameAs: [
								'https://www.instagram.com/tolocafe',
								'https://www.facebook.com/tolocafe',
							],
							servesCuisine: 'Coffee',
							telephone: '+52-55-1234-5678',
							url: 'https://app.tolo.cafe',
						}),
					}}
					type="application/ld+json"
				/>

				<style>{`
				body {
					color-scheme: light dark;
				}
				/* Remove top border from tab bar on web */
				div:has(> [role="tablist"]) {
					border-top: none !important;
					box-shadow: none !important;
				}
				[class$='_navigationMenuRoot'] {
					bottom: 5px !important;
					top: auto !important;
				}
				`}</style>

				{/* Disable body scrolling on web for native-like experience */}
				<ScrollViewStyleReset />
			</head>

			<body>{children}</body>
		</html>
	)
}
