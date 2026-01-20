import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation } from '@tanstack/react-query'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import Button from '@/components/Button'
import { Text } from '@/components/Text'
import { api } from '@/lib/services/api-service'
import { useSetTransactionId } from '@/lib/stores/order-store'

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6]

export default function TableScreen() {
	const { t } = useLingui()
	const { table_id } = useLocalSearchParams<{
		location_id: string
		table_id: string
	}>()

	const [guestsCount, setGuestsCount] = useState(1)
	const setTransactionId = useSetTransactionId()

	const { mutateAsync: createTransaction, isPending } = useMutation({
		mutationFn: (data: { guests_count: number; table_id: string }) =>
			api.orders.createTransaction(data),
	})

	async function handleConfirm() {
		if (table_id) {
			const { transaction_id } = await createTransaction({
				guests_count: guestsCount,
				table_id,
			})
			setTransactionId(transaction_id.toString())
			router.replace('/')
		}
	}

	return (
		<>
			<Stack.Header>
				<Stack.Header.Title>{t`Table ${table_id}`}</Stack.Header.Title>
			</Stack.Header>
			<View style={styles.container}>
				<View style={styles.content}>
					<Text style={styles.subtitle}>
						<Trans>How many guests?</Trans>
					</Text>

					<View style={styles.guestsGrid}>
						{GUEST_OPTIONS.map((count) => (
							<Button
								key={count}
								onPress={() => setGuestsCount(count)}
								style={[
									styles.guestButton,
									guestsCount === count && styles.guestButtonSelected,
								]}
								variant={guestsCount === count ? 'primary' : 'surface'}
							>
								{count}
							</Button>
						))}
					</View>

					<Button
						disabled={isPending}
						onPress={handleConfirm}
						style={styles.confirmButton}
					>
						<Trans>Continue</Trans>
					</Button>
				</View>
			</View>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	confirmButton: {
		marginTop: theme.spacing.lg,
		width: '100%',
	},
	container: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		flex: 1,
		justifyContent: 'center',
		padding: theme.spacing.lg,
	},
	content: {
		alignItems: 'center',
		maxWidth: 400,
		width: '100%',
	},
	guestButton: {
		height: 64,
		width: 64,
	},
	guestButtonSelected: {
		borderColor: theme.colors.verde.solid,
		borderWidth: 2,
	},
	guestsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.md,
		justifyContent: 'center',
		marginTop: theme.spacing.lg,
	},
	subtitle: {
		color: theme.colors.gray.text,
		fontSize: 18,
		marginTop: theme.spacing.sm,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
	},
}))
