/* eslint-disable no-undef */
const { getSentryExpoConfig } = require('@sentry/react-native/metro')

const config = getSentryExpoConfig(__dirname)
const { transformer, resolver } = config

// Required for zustand
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native']

// --- burnt --- https://github.com/nandorojo/burnt?tab=readme-ov-file#installation
config.resolver.sourceExts.push('mjs', 'cjs')
// --- end burnt ---

// --- Lingui Metro Transformer ---
config.transformer = {
	...transformer,
	babelTransformerPath: require.resolve('@lingui/metro-transformer/expo'),
}
config.resolver = {
	...resolver,
	sourceExts: [...resolver.sourceExts, 'po', 'pot'],
}
// --- end Lingui ---

module.exports = config
