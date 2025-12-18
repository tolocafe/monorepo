export const defaultJsonHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Cache-Control':
		'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=2592000, stale-if-error=2592000',
	'Content-Type': 'application/json',
} as const
