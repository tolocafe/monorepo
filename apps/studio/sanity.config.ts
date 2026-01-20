import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { schemaTypes } from './schemaTypes'

export default defineConfig({
	dataset: 'production',
	name: 'default',
	plugins: [structureTool(), visionTool()],
	projectId: 'm1zo6pvi',
	schema: {
		types: schemaTypes,
	},
	title: 'tolo',
})
