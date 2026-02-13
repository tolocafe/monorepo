import { index, route } from '@react-router/dev/routes'
import type { RouteConfig } from '@react-router/dev/routes'

export default [
	// Root index redirects to preferred locale
	index('routes/index.tsx'),

	// Sitemap
	route('sitemap.xml', 'routes/sitemap[.]xml.tsx'),

	// Locale-prefixed routes
	route(':locale', 'routes/locale-layout.tsx', [
		index('routes/home.tsx'),
		// Shop routes
		route('shop', 'routes/shop.tsx'),
		route('shop/cart', 'routes/shop-cart.tsx'),
		route('shop/:handle', 'routes/shop-product.tsx'),
		// Beans routes (localized paths)
		route('beans', 'routes/beans.tsx'),
		route('beans/:slug', 'routes/bean.tsx'),
		route('granos', 'routes/granos.tsx'),
		route('granos/:slug', 'routes/grano.tsx'),
		route('blog', 'routes/blog.tsx'),
		route('blog/:slug', 'routes/blog-post.tsx'),
		route('contact', 'routes/contact.tsx'),
		route('sourcing', 'routes/sourcing.tsx'),
		route('links', 'routes/links.tsx'),
		// Location routes
		route('locations', 'routes/locations.tsx'),
		route('locations/:slug', 'routes/location.tsx'),
		// Dynamic pages from Sanity (must be last to catch remaining slugs)
		route(':slug', 'routes/page.tsx'),
	]),
] satisfies RouteConfig
