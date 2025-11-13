/* eslint-env node */
/* global module */

/** @type {import('@expo/fingerprint').Config} */
const config = {
	fileHookTransform: (source, chunk) => {
		if (source.type === 'contents' && source.id === 'expoConfig') {
			const config = JSON.parse(chunk)
			// Delete app version coming from package.json, should not used for fingerprinting

			delete config.version

			return JSON.stringify(config)
		}

		return chunk
	},
}

module.exports = config
