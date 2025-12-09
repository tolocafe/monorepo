import { POSTER_BASE_URL } from '@/lib/api'

type GetImageUrlOptions = {
	blur?: number
	format?: string
	quality?: number
	source?: 'poster'
	width?: 'auto' | number
}

export function getImageUrl(
	path: string,
	{
		blur = 0,
		format = 'auto',
		quality = 100,
		source,
		width = 'auto',
	}: GetImageUrlOptions,
) {
	return `https://app.tolo.cafe/cdn-cgi/image/quality=${quality},format=${format},blur=${blur},width=${width}/${source === 'poster' ? POSTER_BASE_URL : ''}${path}`
}
