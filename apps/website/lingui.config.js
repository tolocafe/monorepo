/** @type {import('@lingui/conf').LinguiConfig} */
const config = {
	catalogs: [
		{
			exclude: ['**/node_modules/**', '**/dist/**', '**/.react-router/**'],
			include: ['app/**/*.ts', 'app/**/*.tsx'],
			path: 'app/lib/locales/{locale}/messages',
		},
	],
	format: 'po',
	locales: ['en', 'es', 'de', 'fr', 'ja'],
	sourceLocale: 'en',
}

export default config
