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
					content="TOLO - Buen Café. Tu cafetería de barrio donde cada taza cuenta una historia"
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
					content="Tu cafetería de barrio donde cada taza cuenta una historia"
					property="og:description"
				/>
				<meta content="/icon.png" property="og:image" />
				<meta content="512" property="og:image:width" />
				<meta content="512" property="og:image:height" />
				<meta content="Logo de TOLO Coffee Shop" property="og:image:alt" />

				{/* Twitter Card Meta Tags */}
				<meta content="summary" name="twitter:card" />
				<meta content="TOLO - Buen Café" name="twitter:title" />
				<meta
					content="Tu café dónde cada taza cuenta una historia"
					name="twitter:description"
				/>
				<meta content="/icon.png" name="twitter:image" />

				{/* Disable body scrolling on web for native-like experience */}
				<ScrollViewStyleReset />
			</head>

			<body>{children}</body>
		</html>
	)
}
