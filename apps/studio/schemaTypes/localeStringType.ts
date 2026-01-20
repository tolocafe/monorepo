import { defineType } from 'sanity'

const supportedLanguages = [
	{ id: 'es', isDefault: true, title: 'Español' },
	{ id: 'en', title: 'English' },
	{ id: 'de', title: 'Deutsch' },
	{ id: 'fr', title: 'Français' },
	{ id: 'ja', title: '日本語' },
	{ id: 'pt', title: 'Português' },
]

export const baseLanguage = supportedLanguages.find((l) => l.isDefault)

const translationsFieldset = {
	name: 'translations',
	options: { collapsed: true, collapsible: true },
	title: 'Translations',
}

/**
 * Creates a localized type with fields for each language
 */
function createLocaleType(
	name: string,
	title: string,
	fieldType: string,
	fieldOptions?: Record<string, unknown>,
) {
	return defineType({
		fields: supportedLanguages.map((lang) => ({
			...fieldOptions,
			fieldset: lang.isDefault ? undefined : 'translations',
			name: lang.id,
			title: lang.title,
			type: fieldType,
		})),
		fieldsets: [translationsFieldset],
		name,
		title,
		type: 'object',
	})
}

export const localeStringType = createLocaleType(
	'localeString',
	'Localized string',
	'string',
)

export const localeTextType = createLocaleType(
	'localeText',
	'Localized text',
	'text',
	{ rows: 3 },
)

export const localeBlockContentType = createLocaleType(
	'localeBlockContent',
	'Localized block content',
	'array',
	{ of: [{ type: 'block' }] },
)

export const localeSlugType = defineType({
	fields: supportedLanguages.map((lang) => ({
		fieldset: lang.isDefault ? undefined : 'translations',
		name: lang.id,
		options: {
			source: (doc: Record<string, unknown>) => {
				const title = (doc.title || doc.name) as
					| Record<string, string>
					| undefined
				return title?.[lang.id] || ''
			},
		},
		title: lang.title,
		type: 'slug',
	})),
	fieldsets: [translationsFieldset],
	name: 'localeSlug',
	title: 'Localized slug',
	type: 'object',
})
