import { createImageUrlBuilder } from '@sanity/image-url'

import { POSTER_BASE_URL } from '@/lib/api'
import type { SanityImageReference } from '~common/api'

// Sanity project configuration
const SANITY_PROJECT_ID = 'm1zo6pvi'
const SANITY_DATASET = 'production'

// Initialize Sanity image URL builder
const builder = createImageUrlBuilder({
	dataset: SANITY_DATASET,
	projectId: SANITY_PROJECT_ID,
})

type GetImageUrlOptions = {
	blur?: number
	format?: string
	quality?: number
	source?: 'poster' | 'sanity'
	width?: 'auto' | number
}

/**
 * Build a Sanity image URL from a sourceId (asset ID)
 * @param sourceId - Sanity asset ID (e.g., "image-abc123def456-1200x800-jpg")
 * @param options - Image transformation options
 * @returns Formatted Sanity CDN URL with transformations, or empty string if sourceId is invalid
 */
export function buildSanityImageUrl(
	sourceId: string | undefined,
	options: Omit<GetImageUrlOptions, 'source'> = {},
): string {
	// Return empty string for invalid sourceIds
	if (!sourceId || sourceId.trim() === '') {
		return ''
	}

	const { blur = 0, format = 'auto', quality = 100, width = 'auto' } = options

	try {
		let url = builder.image(sourceId).auto('format')

		if (quality !== 100) {
			url = url.quality(quality)
		}

		if (width !== 'auto') {
			url = url.width(width)
		}

		if (blur > 0) {
			url = url.blur(blur)
		}

		if (format !== 'auto') {
			url = url.format(format as 'jpg' | 'png' | 'webp')
		}

		return url.url()
	} catch {
		// Return empty string if image builder fails
		return ''
	}
}

/**
 * Helper to get the first image sourceId from a SanityImageReference array
 */
export function getFirstImageSourceId(
	images: SanityImageReference[] | undefined,
): string | undefined {
	return images?.[0]?.sourceId
}

/**
 * Get image URL from either Sanity or Poster source
 * For Sanity images, pass the sourceId from SanityImageReference
 */
export function getImageUrl(
	path: string | undefined,
	{
		blur = 0,
		format = 'auto',
		quality = 100,
		source,
		width = 'auto',
	}: GetImageUrlOptions,
) {
	if (source === 'sanity') {
		return buildSanityImageUrl(path, { blur, format, quality, width })
	}

	return `https://app.tolo.cafe/cdn-cgi/image/quality=${quality},format=${format},blur=${blur},width=${width}/${source === 'poster' ? POSTER_BASE_URL : ''}${path}`
}
