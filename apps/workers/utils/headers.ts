export const defaultJsonHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Cache-Control':
		'public, max-age=60, s-maxage=600, stale-while-revalidate=86400, stale-if-error=86400',
	'Content-Type': 'application/json',
	Vary: 'Accept-Language',
} as const
