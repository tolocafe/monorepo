import { Alert, TouchableOpacity, View } from 'react-native'

import { CreateOrderSchema } from '@common/schemas'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { ScreenContainer } from '@/components/ScreenContainer'
import { H2, Paragraph, Text } from '@/components/Text'
import { selfQueryOptions } from '@/lib/queries/auth'
import { createOrderMutationOptions } from '@/lib/queries/order'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import {
	useClearOrder,
	useCurrentOrder,
	useRemoveItem,
	useUpdateItem,
} from '@/lib/stores/order-store'
import { formatPosterPrice } from '@/lib/utils/price'

import type { OrderProduct } from '@/lib/stores/order-store'

const getProductName = (productId: string): string => {
	const productData = queryClient.getQueryData(
		productQueryOptions(productId).queryKey,
	)
	return productData?.product_name || `Product ID: ${productId}`
}

const getProductCategory = (productId: string): null | string => {
	const productData = queryClient.getQueryData(
		productQueryOptions(productId).queryKey,
	)
	return productData?.category_name || null
}

const getProductPrice = (productId: string): null | string => {
	const productData = queryClient.getQueryData(
		productQueryOptions(productId).queryKey,
	)
	const product = productData
	if (!product) return null
	const priceRaw = Object.values(product.price)[0] || '0'
	return formatPosterPrice(Number(priceRaw))
}

export default function OrderDetail() {
	const { t } = useLingui()
	const order = useCurrentOrder()
	const updateItem = useUpdateItem()
	const removeItem = useRemoveItem()

	const clearOrder = useClearOrder()
	const { data: user } = useQuery(selfQueryOptions)

	// Calculate current order total (in cents) for balance checks and display
	const currentOrderTotalCents = order?.products.reduce((sum, item) => {
		const productData = queryClient.getQueryData(
			productQueryOptions(item.id).queryKey,
		)
		const unitPriceCents = productData
			? Number(Object.values(productData.price)[0] || 0)
			: 0
		const modificationsTotalCents = (item.modifications ?? []).reduce(
			(moduleSum, module_) => moduleSum + (module_.price || 0),
			0,
		)
		return sum + (unitPriceCents + modificationsTotalCents) * item.quantity
	}, 0) ?? 0

	const { mutateAsync: createOrder } = useMutation({
		...createOrderMutationOptions,
		onError() {
			Alert.alert(t`Error`, t`Failed to submit order. Please try again.`)
		},
		onSuccess() {
			router.replace('/(tabs)/orders')
		},
	})

	const { Field, handleSubmit, Subscribe } = useForm({
		defaultValues: {
			comment: '',
			serviceMode: 2,
		},
		onSubmit: ({ value }) => {
			// Guard: prevent order submission when wallet balance is insufficient
			const walletCents = Number(user?.ewallet ?? '0')
			if (walletCents < currentOrderTotalCents) {
				Alert.alert(
					t`Insufficient Balance`,
					t`Your wallet balance is insufficient to complete this order.`,
				)
				return
			}

			return createOrder({
				...value,
				client: { id: user?.client_id as string }, // This will be set by the server
				products:
					order?.products.map((product) => ({
						count: product.quantity,
						id: product.id,
					})) ?? [],
			})
		},
		validators: { onChange: CreateOrderSchema.safeParse },
	})

	const handleQuantityChange = (productId: string, quantity: number) => {
		updateItem(productId, quantity)
	}

	const handleRemoveItem = (productId: string) => {
		removeItem(productId)
	}

	const handleClearOrder = () => {
		Alert.alert(
			t`Clear Order`,
			t`Are you sure you want to clear this order? This action cannot be undone.`,
			[
				{ style: 'cancel', text: t`Cancel` },
				{
					onPress: () => {
						clearOrder()
						router.back()
					},
					style: 'destructive',
					text: t`Clear`,
				},
			],
		)
	}

	const renderOrderItem = (item: OrderProduct, index: number) => (
		<View key={`${item.id}-${index}`} style={styles.orderItem}>
			<View style={styles.itemHeader}>
				<Paragraph style={styles.itemName}>{getProductName(item.id)}</Paragraph>
				<TouchableOpacity
					onPress={() => handleRemoveItem(item.id)}
					style={styles.removeButton}
				>
					<Ionicons color="#ff4444" name="trash-outline" size={20} />
				</TouchableOpacity>
			</View>

			<View style={styles.itemDetails}>
				<View style={styles.quantityContainer}>
					<>
						<TouchableOpacity
							disabled={item.quantity <= 1}
							onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
							style={styles.quantityButton}
						>
							<Ionicons
								color={item.quantity <= 1 ? '#ccc' : '#333'}
								name="remove"
								size={20}
							/>
						</TouchableOpacity>
						<Text style={styles.quantity}>{item.quantity}</Text>
						<TouchableOpacity
							onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
							style={styles.quantityButton}
						>
							<Ionicons color="#333" name="add" size={20} />
						</TouchableOpacity>
					</>
				</View>
				<Paragraph>{getProductPrice(item.id) ?? t`Unavailable`}</Paragraph>
			</View>

			{getProductCategory(item.id) && (
				<Paragraph style={styles.itemMeta}>
					{getProductCategory(item.id)}
				</Paragraph>
			)}

			{item.modifications && item.modifications.length > 0 && (
				<View style={styles.modifications}>
					{item.modifications.map((module_, moduleIndex) => (
						<Paragraph key={moduleIndex} style={styles.modificationText}>
							+ {module_.name} (+${module_.price.toFixed(2)})
						</Paragraph>
					))}
				</View>
			)}
		</View>
	)

	if (!order) {
		return (
			<>
				<Head>
					<title>{t`Order Not Found`}</title>
				</Head>
				<View style={styles.container}>
					<View style={styles.emptyContainer}>
						<Paragraph style={styles.emptyText}>
							<Trans>The requested order could not be found.</Trans>
						</Paragraph>
					</View>
				</View>
			</>
		)
	}

 

	return (
		<>
			<Head>
				<title>{t`Current Order`}</title>
			</Head>
			<ScreenContainer keyboardAware>
				{user && (
					<Card style={styles.walletCard}>
						<Paragraph style={styles.walletLabel}>
							<Trans>Wallet Balance</Trans>
						</Paragraph>
						<Paragraph style={styles.walletValue}>
							${(Number(user.ewallet ?? '0') / 100).toFixed(2)}
						</Paragraph>
					</Card>
				)}

				<View style={styles.itemsSection}>
					<H2>
						<Trans>Order Items</Trans>
					</H2>
					{order.products.map((item, index) => renderOrderItem(item, index))}
				</View>

				<View style={styles.noteSection}>
					<H2>
						<Trans>Customer Note</Trans>
					</H2>
					<Field
						name="comment"
						validators={{
							onChange: ({ value }) => {
								if (typeof value === 'string' && value.length > 2000) {
									return t`Maximum length is 2000 characters`
								}
							},
						}}
					>
						{(field) => (
							<Input
								multiline
								numberOfLines={3}
								onChangeText={(text) => field.handleChange(text)}
								placeholder={t`Add any special instructions...`}
								value={field.state.value}
							/>
						)}
					</Field>
				</View>

				<View style={styles.totalSection}>
					<View style={styles.totalRow}>
						<Paragraph>
							<Trans>Total</Trans>
						</Paragraph>
						<Paragraph style={styles.totalAmount}>
							{formatPosterPrice(currentOrderTotalCents)}
						</Paragraph>
					</View>
				</View>

				<View style={styles.actionButtons}>
					<Button onPress={handleClearOrder} variant="surface">
						<Trans>Clear Order</Trans>
					</Button>

					<Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button disabled={!canSubmit} fullWidth onPress={handleSubmit}>
								{isSubmitting ? (
									<Trans>Submitting...</Trans>
								) : (
									<Trans>Submit Order</Trans>
								)}
							</Button>
						)}
					</Subscribe>
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	actionButtons: {
		flexDirection: 'row',
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	container: {
		flex: 1,
	},
	emptyContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		padding: theme.spacing.xl,
	},
	emptyText: {
		color: theme.colors.textSecondary,
		textAlign: 'center',
	},
	itemDetails: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	itemHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: theme.spacing.sm,
	},
	itemMeta: {
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.xs,
	},
	itemName: {
		flex: 1,
		fontSize: theme.fontSizes.md,
		fontWeight: theme.fontWeights.medium,
	},
	itemsSection: {
		padding: theme.layout.screenPadding,
	},
	modifications: {
		borderTopColor: theme.colors.border,
		borderTopWidth: 1,
		marginTop: theme.spacing.sm,
		paddingTop: theme.spacing.sm,
	},
	modificationText: {
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
	},
	noteSection: {
		padding: theme.layout.screenPadding,
	},
	orderItem: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
		marginBottom: theme.spacing.md,
		padding: theme.spacing.md,
	},
	orderStatus: {
		color: theme.colors.primary,
	},
	quantity: {
		marginHorizontal: theme.spacing.md,
		minWidth: 30,
		textAlign: 'center',
	},
	quantityButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: 16,
		borderWidth: 1,
		height: 32,
		justifyContent: 'center',
		width: 32,
	},
	quantityContainer: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	removeButton: {
		padding: theme.spacing.xs,
	},
	totalAmount: {
		color: theme.colors.primary,
	},

	totalRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	totalSection: {
		borderTopColor: theme.colors.border,
		borderTopWidth: 1,
		padding: theme.layout.screenPadding,
	},
	walletCard: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'space-between',
		marginHorizontal: theme.layout.screenPadding,
		marginVertical: theme.spacing.sm,
	},

	walletLabel: {
		color: theme.colors.textSecondary,
	},
	walletValue: {
		color: theme.colors.primary,
		fontWeight: theme.fontWeights.semibold,
	},
}))
