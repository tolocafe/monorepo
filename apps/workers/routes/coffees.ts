import type { SupportedLocale } from '@tolo/common/locales'
import { Hono } from 'hono'

import { defaultJsonHeaders } from '@/utils/headers'
import sanity from '@/utils/sanity'

import type { Bindings } from '../types'

type Variables = {
	language: SupportedLocale
}

const coffees = new Hono<{ Bindings: Bindings; Variables: Variables }>()
	.get('/', async (context) => {
		const language = context.get('language')

		try {
			const beans = await sanity.listBeans(context.env, language)

			const localized = beans.map((bean) => ({
				name: bean.name || '',
				origin: bean.origin || '',
				process: bean.process || '',
				region: bean.region || '',
				slug: bean.slug?.current || '',
				'tasting-notes': bean.tastingNotes,
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
		const bean = await sanity.getBean(
			context.env,
			context.req.param('id'),
			language,
		)

		const localized = {
			name: bean.name || '',
			origin: bean.origin || '',
			process: bean.process || '',
			region: bean.region || '',
			slug: bean.slug?.current || '',
			'tasting-notes': bean.tastingNotes,
		}

		return context.json(localized, 200, defaultJsonHeaders)
	})

export default coffees
