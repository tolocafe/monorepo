import { useRoute } from '@react-navigation/native'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import ScreenContainer from '@/components/ScreenContainer'
import { useOrderStore } from '@/lib/stores/order-store'

export default function TableScreen() {
	const { params } = useRoute()
	const { location_id, table_id } = params as {
		location_id: string
		table_id: string
	}

	const setLocationAndTable = useOrderStore(
		(state) => state.setLocationAndTable,
	)

	useEffect(() => {
		if (location_id && table_id) {
			setLocationAndTable(location_id, table_id)
		}

		router.back()
	}, [location_id, table_id, setLocationAndTable])

	return (
		<ScreenContainer noScroll contentContainerStyle={styles.contentContainer}>
			<ActivityIndicator size="large" />
		</ScreenContainer>
	)
}

const styles = StyleSheet.create({
	contentContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
})
