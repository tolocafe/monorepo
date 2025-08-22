import firebase from '@react-native-firebase/app'
import { MMKV } from 'react-native-mmkv'
// Before initializing Firebase set the Async Storage implementation
// that will be used to persist user sessions.

const firebaseStorage = new MMKV()

const storage = {
	getItem: (key: string) => firebaseStorage.getString(key),
	removeItem: (key: string) => firebaseStorage.delete(key),
	setItem: (key: string, value: string) => firebaseStorage.set(key, value),
}

firebase.setReactNativeAsyncStorage(storage)

await firebase.initializeApp({
	apiKey: 'AIzaSyCIBdUpvzHyvetsp2p0g8AM8yHob6aYd1E',
	appId: '1:503502595311:web:5f7dd78115adc82464671a',
	authDomain: 'tolo-cafe.firebaseapp.com',
	measurementId: 'G-VQ7Q48DH3G',
	messagingSenderId: '503502595311',
	projectId: 'tolo-cafe',
	storageBucket: 'tolo-cafe.firebasestorage.app',
})
