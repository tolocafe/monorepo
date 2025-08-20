import { POSTER_BASE_URL } from '../api'

export function getImageUrl(
	path: string,
	{
		blur = 0,
		format = 'auto',
		quality = 100,
		width = 'auto',
	}: {
		blur?: number
		format?: string
		quality?: number
		width?: 'auto' | number
	},
) {
	return `https://app.tolo.cafe/cdn-cgi/image/quality=${quality},format=${format},blur=${blur},width=${width}/${POSTER_BASE_URL}${path}`
}
