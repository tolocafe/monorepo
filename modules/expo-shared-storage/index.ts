// Reexport the native module. On web, it will be resolved to TargetLinksModule.web.ts
// and on native platforms to TargetLinksModule.ts
export * from './src/ExpoSharedStorage.types'
export { default } from './src/ExpoSharedStorageModule'
