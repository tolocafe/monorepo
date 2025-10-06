import type { PropsWithChildren } from 'react'

import { ScrollViewStyleReset } from 'expo-router/html'

// Initialize Unistyles for web static rendering
import '@/lib/styles/unistyles'

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

				{/* SEO and Performance Meta Tags */}
				<meta content="#ffffff" name="theme-color" />
				<meta content="light dark" name="color-scheme" />
				<meta content="yes" name="mobile-web-app-capable" />
				<meta content="yes" name="apple-mobile-web-app-capable" />
				<meta content="default" name="apple-mobile-web-app-status-bar-style" />
				<meta content="TOLO" name="apple-mobile-web-app-title" />

				<link href="/icon.png" rel="apple-touch-icon" />
				<link href="/manifest.json" rel="manifest" />

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
				<meta content="/og-image.png" property="og:image" />
				<meta content="Logo de TOLO Buen Café" property="og:image:alt" />

				{/* Twitter Card Meta Tags */}
				<meta content="summary" name="twitter:card" />
				<meta content="TOLO - Buen Café" name="twitter:title" />
				<meta
					content="Tu cafetería dónde se sirve buen café, así nomás"
					name="twitter:description"
				/>
				<meta content="/og-image.png" name="twitter:image" />

				<style>{`
				body {
					color-scheme: light dark;
				}
				`}</style>

				{/* Disable body scrolling on web for native-like experience */}
				<ScrollViewStyleReset />
			</head>

			<body>{children}</body>
		</html>
	)
}
