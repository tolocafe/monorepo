import { Hono } from 'hono'

import type { SupportedLocale } from '~common/locales'
import { defaultJsonHeaders } from '~workers/utils/headers'
import sanity, {
	getLocalizedSlug,
	getLocalizedString,
} from '~workers/utils/sanity'

import type { Bindings } from '../types'

type Variables = {
	language: SupportedLocale
}

const coffees = new Hono<{ Bindings: Bindings; Variables: Variables }>()
	.get('/', async (context) => {
		const language = context.get('language')

		try {
			const beans = await sanity.listBeans(context.env)

			const localized = beans.map((bean) => ({
				name: getLocalizedString(bean.name, language) || '',
				origin: getLocalizedString(bean.origin, language) || '',
				process: getLocalizedString(bean.process, language) || '',
				region: getLocalizedString(bean.region, language) || '',
				slug: getLocalizedSlug(bean.slug, language) || '',
				'tasting-notes': getLocalizedString(bean.tastingNotes, language),
			}))

			return context.json(localized, 200, defaultJsonHeaders)
		} catch {
			return context.json(
				{ error: 'Failed to fetch coffees' },
				500,
				defaultJsonHeaders,
			)
		}
	})
	.get('/:id', async (context) => {
		const language = context.get('language')
		const bean = await sanity.getBean(context.env, context.req.param('id'))

		const localized = {
			name: getLocalizedString(bean.name, language) || '',
			origin: getLocalizedString(bean.origin, language) || '',
			process: getLocalizedString(bean.process, language) || '',
			region: getLocalizedString(bean.region, language) || '',
			slug: getLocalizedSlug(bean.slug, language) || '',
			'tasting-notes': getLocalizedString(bean.tastingNotes, language),
		}

		return context.json(localized, 200, defaultJsonHeaders)
	})

export default coffees
