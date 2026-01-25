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

export const localeBlockContentType = defineType({
	fields: supportedLanguages.map((lang) => ({
		fieldset: lang.isDefault ? undefined : 'translations',
		name: lang.id,
		of: [
			{
				lists: [
					{ title: 'Bullet', value: 'bullet' },
					{ title: 'Numbered', value: 'number' },
				],
				marks: {
					annotations: [
						{
							fields: [
								{
									name: 'href',
									title: 'URL',
									type: 'url',
									validation: (rule) =>
										rule.uri({
											allowRelative: true,
											scheme: ['http', 'https', 'mailto', 'tel'],
										}),
								},
							],
							name: 'link',
							title: 'Link',
							type: 'object',
						},
					],
					decorators: [
						{ title: 'Bold', value: 'strong' },
						{ title: 'Italic', value: 'em' },
						{ title: 'Underline', value: 'underline' },
					],
				},
				styles: [
					{ title: 'Normal', value: 'normal' },
					{ title: 'H2', value: 'h2' },
					{ title: 'H3', value: 'h3' },
					{ title: 'Quote', value: 'blockquote' },
				],
				type: 'block',
			},
		],
		title: lang.title,
		type: 'array',
	})),
	fieldsets: [translationsFieldset],
	name: 'localeBlockContent',
	title: 'Localized block content',
	type: 'object',
})

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
