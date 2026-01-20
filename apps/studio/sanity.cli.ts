import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
	api: {
		dataset: 'production',
		projectId: 'm1zo6pvi',
	},
	deployment: {
		/**
		 * Enable auto-updates for studios.
		 * Learn more at https://www.sanity.io/docs/cli#auto-updates
		 */
		appId: 'l8johqhcfiuc31rvwsuv83za',
		autoUpdates: true,
	},
})
