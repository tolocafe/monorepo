import { NativeModule, requireNativeModule } from 'expo'

declare class ExpoSharedStorageModule extends NativeModule {
	getNumber: (key: string) => null | number
	getString: (key: string) => null | string
	setNumber: (key: string, value: number) => void
	setString: (key: string, value: string) => void
}

export default requireNativeModule<ExpoSharedStorageModule>('ExpoSharedStorage')
