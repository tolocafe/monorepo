/* eslint-disable no-undef */
const { withEntitlementsPlist } = require('@expo/config-plugins')

/**
 * Add App Groups entitlement to enable data sharing with widgets
 */
const withAppGroups = (config) =>
	withEntitlementsPlist(config, (config) => {
		config.modResults['com.apple.security.application-groups'] = [
			'group.cafe.tolo.app',
		]
		return config
	})

module.exports = withAppGroups
