import { createMMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '~/lib/constants/storage'

export const zustandStore = createMMKV({
	id: STORAGE_KEYS.ZUSTAND,
})
