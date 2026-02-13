import { BASE_URL } from '@/lib/constants'
import { SUPPORTED_LOCALES } from '@/lib/locale'
import { client } from '@/lib/sanity'
import type { Post, Page, Bean, Location, StoreProduct } from '@/lib/sanity'

const POSTS_QUERY = `*[_type == "post" && (defined(slug.es.current) || defined(slug.en.current))]{
  slug, publishedAt, _updatedAt
}`

const PAGES_QUERY = `*[_type == "page" && (defined(slug.es.current) || defined(slug.en.current))]{
  slug, _updatedAt
}`

const BEANS_QUERY = `*[_type == "bean" && (defined(slug.es.current) || defined(slug.en.current))]{
  slug, _updatedAt
}`

const LOCATIONS_QUERY = `*[_type == "location" && (defined(slug.es.current) || defined(slug.en.current))]{
  slug, _updatedAt, isUpcoming
}`

const STORE_PRODUCTS_QUERY = `*[_type == "storeProduct" && isVisible == true]{
  shopifyHandle, slug, _updatedAt
}`

interface SitemapEntry {
	loc: string
	lastmod?: string
	changefreq?: string
	priority?: string
}

function generateSitemapXml(entries: SitemapEntry[]): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(entry) => `  <url>
    <loc>${entry.loc}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`,
	)
	.join('\n')}
</urlset>`
}

export async function loader() {
	const [posts, pages, beans, locations, products] = await Promise.all([
		client.fetch<Pick<Post, 'slug' | 'publishedAt' | '_updatedAt'>[]>(
			POSTS_QUERY,
		),
		client.fetch<Pick<Page, 'slug' | '_updatedAt'>[]>(PAGES_QUERY),
		client.fetch<Pick<Bean, 'slug' | '_updatedAt'>[]>(BEANS_QUERY),
		client.fetch<Pick<Location, 'slug' | '_updatedAt' | 'isUpcoming'>[]>(
			LOCATIONS_QUERY,
		),
		client.fetch<Pick<StoreProduct, 'shopifyHandle' | 'slug' | '_updatedAt'>[]>(
			STORE_PRODUCTS_QUERY,
		),
	])

	const entries: SitemapEntry[] = []

	// Static pages for each locale
	for (const locale of SUPPORTED_LOCALES) {
		// Home
		entries.push({
			changefreq: 'daily',
			loc: `${BASE_URL}/${locale}`,
			priority: '1.0',
		})

		// Shop index
		entries.push({
			changefreq: 'daily',
			loc: `${BASE_URL}/${locale}/shop`,
			priority: '0.9',
		})

		// Beans index
		entries.push({
			changefreq: 'weekly',
			loc: `${BASE_URL}/${locale}/beans`,
			priority: '0.8',
		})

		// Locations index
		entries.push({
			changefreq: 'weekly',
			loc: `${BASE_URL}/${locale}/locations`,
			priority: '0.8',
		})

		// Blog index
		entries.push({
			changefreq: 'daily',
			loc: `${BASE_URL}/${locale}/blog`,
			priority: '0.8',
		})

		// Contact
		entries.push({
			changefreq: 'monthly',
			loc: `${BASE_URL}/${locale}/contact`,
			priority: '0.6',
		})

		// Sourcing
		entries.push({
			changefreq: 'monthly',
			loc: `${BASE_URL}/${locale}/sourcing`,
			priority: '0.8',
		})
	}

	// Dynamic shop products
	for (const product of products) {
		for (const locale of SUPPORTED_LOCALES) {
			const handle =
				product.slug?.[locale]?.current ||
				product.slug?.es?.current ||
				product.shopifyHandle
			if (handle) {
				entries.push({
					changefreq: 'daily',
					lastmod: product._updatedAt?.split('T')[0],
					loc: `${BASE_URL}/${locale}/shop/${handle}`,
					priority: '0.8',
				})
			}
		}
	}

	// Dynamic beans
	for (const bean of beans) {
		for (const locale of SUPPORTED_LOCALES) {
			const slug = bean.slug?.[locale]?.current || bean.slug?.es?.current
			if (slug) {
				entries.push({
					changefreq: 'weekly',
					lastmod: bean._updatedAt?.split('T')[0],
					loc: `${BASE_URL}/${locale}/beans/${slug}`,
					priority: '0.7',
				})
			}
		}
	}

	// Dynamic locations (exclude upcoming locations)
	for (const location of locations) {
		if (location.isUpcoming) continue
		for (const locale of SUPPORTED_LOCALES) {
			const slug =
				location.slug?.[locale]?.current || location.slug?.es?.current
			if (slug) {
				entries.push({
					changefreq: 'monthly',
					lastmod: location._updatedAt?.split('T')[0],
					loc: `${BASE_URL}/${locale}/locations/${slug}`,
					priority: '0.7',
				})
			}
		}
	}

	// Dynamic blog posts
	for (const post of posts) {
		for (const locale of SUPPORTED_LOCALES) {
			const slug = post.slug?.[locale]?.current || post.slug?.es?.current
			if (slug) {
				entries.push({
					changefreq: 'weekly',
					lastmod:
						post._updatedAt?.split('T')[0] || post.publishedAt?.split('T')[0],
					loc: `${BASE_URL}/${locale}/blog/${slug}`,
					priority: '0.7',
				})
			}
		}
	}

	// Dynamic pages
	for (const page of pages) {
		for (const locale of SUPPORTED_LOCALES) {
			const slug = page.slug?.[locale]?.current || page.slug?.es?.current
			if (slug) {
				entries.push({
					changefreq: 'monthly',
					lastmod: page._updatedAt?.split('T')[0],
					loc: `${BASE_URL}/${locale}/${slug}`,
					priority: '0.6',
				})
			}
		}
	}

	return new Response(generateSitemapXml(entries), {
		headers: {
			'Cache-Control': 'public, max-age=3600',
			'Content-Type': 'application/xml',
		},
	})
}
