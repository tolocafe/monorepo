/* eslint-disable no-undef */
const { getSentryExpoConfig } = require('@sentry/react-native/metro')

const config = getSentryExpoConfig(__dirname)

// Required for zustand
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native']

// --- burnt --- https://github.com/nandorojo/burnt?tab=readme-ov-file#installation
config.resolver.sourceExts.push('mjs', 'cjs')
// --- end burnt ---

module.exports = config
