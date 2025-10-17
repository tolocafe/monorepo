/* eslint-disable unicorn/no-anonymous-default-export, no-undef */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (_config) => ({
	displayName: 'TOLO Menu',
	entitlements: {
		'com.apple.security.application-groups': ['group.cafe.tolo.app'],
	},
	icon: 'https://github.com/expo.png',
	type: 'clip',
})
