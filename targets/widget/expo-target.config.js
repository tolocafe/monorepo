/* eslint-disable unicorn/no-anonymous-default-export, no-undef */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
	deploymentTarget: '18.0',
	displayName: 'TOLO Widget',
	frameworks: ['WidgetKit', 'SwiftUI'],
	type: 'widget',
	version: config.version,
})
