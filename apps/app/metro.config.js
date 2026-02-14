/* eslint-disable no-undef */
const { getSentryExpoConfig } = require('@sentry/react-native/metro')
const {
	wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config')

const config = wrapWithReanimatedMetroConfig(getSentryExpoConfig(__dirname))

// Required for zustand
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native']

// --- burnt --- https://github.com/nandorojo/burnt?tab=readme-ov-file#installation
config.resolver.sourceExts.push('mjs', 'cjs')
// --- end burnt ---

// --- Lingui Metro Transformer ---
config.transformer = {
	...config.transformer,
	babelTransformerPath: require.resolve('@lingui/metro-transformer/expo'),
}
config.resolver = {
	...config.resolver,
	sourceExts: [...config.resolver.sourceExts, 'po', 'pot'],
}
// --- end Lingui ---

module.exports = config
