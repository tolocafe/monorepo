/* eslint-disable unicorn/no-anonymous-default-export, no-undef */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
	displayName: 'TOLO Clip',
	entitlements: {
		'com.apple.developer.associated-domains': ['appclips:app.tolo.cafe'],
		'com.apple.security.application-groups': ['group.cafe.tolo.app'],
	},
	type: 'clip',
	version: config.version,
})
