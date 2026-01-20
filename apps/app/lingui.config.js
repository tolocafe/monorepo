//* eslint-disable no-undef */
/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
	catalogs: [
		{
			exclude: ['**/node_modules/**', '**/dist/**'],
			include: ['src/**/*.ts', 'src/**/*.tsx'],
			path: 'src/lib/locales/{locale}/messages',
		},
	],
	format: 'po',
	locales: ['es', 'en', 'fr', 'pt', 'ja', 'de'],
	sourceLocale: 'en',
}
