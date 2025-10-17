/* eslint-disable no-undef */
//withAppBuildGradlePlugin.js
const { withAppBuildGradle } = require('expo/config-plugins')

module.exports = function withAppBuildGradlePlugin(appConfig) {
	return withAppBuildGradle(appConfig, (decoratedAppConfig) => {
		// HACK
		// Workaround for https://github.com/facebook/react-native/issues/42024
		// Remove when React Native resolves this issue
		// -prfa

		const MATCH_STRING = 'defaultConfig {\n'

		const stringContents = decoratedAppConfig.modResults.contents

		const index = stringContents.indexOf(MATCH_STRING) + MATCH_STRING.length

		decoratedAppConfig.modResults.contents = `${stringContents.slice(
			0,
			index,
		)}\nresConfigs "es"\n${stringContents.slice(index)}`

		return decoratedAppConfig
	})
}
