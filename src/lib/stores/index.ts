import { MMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '../constants/storage'

export const zustandStore = new MMKV({
	id: STORAGE_KEYS.ZUSTAND_STORE,
})
