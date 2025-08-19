import { useMemo } from 'react'
import { Alert, TouchableOpacity, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, Stack } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import type { Product } from '@common/api'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { ScreenContainer } from '@/components/ScreenContainer'
import { H2, Paragraph, Text } from '@/components/Text'
import { selfQueryOptions } from '@/lib/queries/auth'
import {
	createOrderMutationOptions,
	orderQueryOptions,
} from '@/lib/queries/order'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import {
	useClearOrder,
	useCurrentOrder,
	useUpdateItem,
} from '@/lib/stores/order-store'
import { formatPrice } from '@/lib/utils/price'

import type { OrderProduct } from '@/lib/stores/order-store'

const getProductName = (productId: string): string => {
	const productData = queryClient.getQueryData<Product>(
		productQueryOptions(productId).queryKey,
	)
	return productData?.product_name || `Product ID: ${productId}`
}

const getProductCategory = (productId: string): null | string => {
	const productData = queryClient.getQueryData<Product>(
		productQueryOptions(productId).queryKey,
	)

	return productData?.category_name || null
}

function getOrderTotal(products: OrderProduct[]) {
	return products.reduce((sum, item) => {
		const productData = queryClient.getQueryData<Product>(
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
	}, 0)
}

const getProductPrice = (productId: string): null | string => {
	const productData = queryClient.getQueryData<Product>(
		productQueryOptions(productId).queryKey,
	)

	const product = productData

	if (!product) return null
	const priceRaw = Object.values(product.price)[0] || '0'
	return formatPrice(Number(priceRaw))
}

export default function OrderDetail() {
	const { t } = useLingui()
	const order = useCurrentOrder()
	const updateItem = useUpdateItem()

	const clearOrder = useClearOrder()
	const { data: user } = useQuery(selfQueryOptions)

	// Prefetch and subscribe to only the product details that are not in cache
	const productIds = useMemo(
		() => [...new Set((order?.products ?? []).map((product) => product.id))],
		[order?.products],
	)

	const missingProductIds = useMemo(
		() =>
			productIds.filter(
				(productId) =>
					!queryClient.getQueryData<Product>(
						productQueryOptions(productId).queryKey,
					),
			),
		[productIds],
	)

	useQueries({
		queries: missingProductIds.map((productId) =>
			productQueryOptions(productId),
		),
	})

	const { mutateAsync: createOrder } = useMutation({
		...createOrderMutationOptions,
		onError() {
			Burnt.toast({
				duration: 3,
				haptic: 'error',
				message: t`Failed to submit order. Please try again.`,
				preset: 'error',
				title: t`Error`,
			})
		},
		onSuccess() {
			Burnt.toast({
				duration: 3,
				haptic: 'success',
				message: t`Thanks! We'll start preparing it now.`,
				preset: 'done',
				title: t`Order placed`,
			})
			clearOrder()
			void queryClient.invalidateQueries(orderQueryOptions)

			router.back()
		},
	})

	const orderTotal = getOrderTotal(order?.products ?? [])

	const { Field, handleSubmit, Subscribe } = useForm({
		defaultValues: {
			// This will be set by the server
			client: { id: user?.client_id as string },
			comment: '',
			payment: { id: '', type: 'E_WALLET' as const },
			products:
				order?.products.map((product) => ({
					count: product.quantity,
					product_id: product.id,
				})) ?? [],
			serviceMode: 2,
		},
		async onSubmit({ value }) {
			const hasInsufficientBalance =
				!user || Number(user.ewallet ?? '0') < orderTotal

			// Require explicit action if funds are insufficient
			if (hasInsufficientBalance) {
				Alert.alert(
					t`Insufficient Balance`,
					t`You don't have enough balance in your wallet. Please top up your wallet first.`,
					[
						{
							onPress: () => router.push('/more/top-up'),
							text: t`Top Up`,
						},
						{
							style: 'cancel',
							text: t`Cancel`,
						},
					],
				)
				return
			}

			return createOrder({
				...value,
				payment: { amount: orderTotal },
			})
		},
	})

	const handleQuantityChange = (productId: string, quantity: number) => {
		updateItem(productId, quantity)
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
				{getProductCategory(item.id) && (
					<Paragraph style={styles.itemMeta}>
						{getProductCategory(item.id)}
					</Paragraph>
				)}
			</View>

			<View style={styles.itemDetails}>
				<View style={styles.quantityContainer}>
					<TouchableOpacity
						onLongPress={() => handleQuantityChange(item.id, 0)}
						onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
						style={styles.quantityButton}
					>
						<Ionicons color="#333" name="remove" size={20} />
					</TouchableOpacity>
					<Text align="center" style={styles.quantity}>
						{item.quantity}
					</Text>
					<TouchableOpacity
						onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
						style={styles.quantityButton}
					>
						<Ionicons color="#333" name="add" size={20} />
					</TouchableOpacity>
				</View>
				<Paragraph>{getProductPrice(item.id) ?? t`Unavailable`}</Paragraph>
			</View>
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
			<Stack.Screen
				options={{
					headerRight: () => (
						<Button onPress={handleClearOrder} variant="transparent">
							<Trans>Cancel</Trans>
						</Button>
					),
				}}
			/>

			<ScreenContainer contentContainerStyle={styles.container} keyboardAware>
				{user && (
					<Card style={styles.walletCard}>
						<Paragraph>
							<Trans>Wallet Balance</Trans>
						</Paragraph>
						<Paragraph weight="bold">
							{formatPrice(user.ewallet ?? '0')}
						</Paragraph>
					</Card>
				)}

				<H2>
					<Trans>Items</Trans>
				</H2>

				<Card style={styles.itemsCard}>
					{order.products.map((item, index) => renderOrderItem(item, index))}
					<View style={styles.totalRow}>
						<Paragraph weight="bold">
							<Trans>Total</Trans>
						</Paragraph>
						<Paragraph style={styles.totalAmount} weight="bold">
							{formatPrice(orderTotal)}
						</Paragraph>
					</View>
				</Card>

				<View style={styles.noteSection}>
					<H2>
						<Trans>Additional</Trans>
					</H2>
					<Card>
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
					</Card>
				</View>

				<View style={styles.actionButtons}>
					<Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => {
							const hasInsufficientBalance =
								!user || Number(user.ewallet ?? '0') < orderTotal

							return (
								<Button
									disabled={!canSubmit || hasInsufficientBalance}
									fullWidth
									onPress={handleSubmit}
								>
									{isSubmitting ? (
										<Trans>Sending Order...</Trans>
									) : (
										<Trans>Send Order</Trans>
									)}
								</Button>
							)
						}}
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
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
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
		width: '100%',
	},
	itemHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	itemMeta: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		color: '#fff',
		fontSize: theme.fontSizes.sm,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
	},
	itemName: {
		flex: 1,
		fontWeight: theme.fontWeights.medium,
	},
	itemsCard: {
		gap: theme.spacing.md,
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
		gap: theme.spacing.md,
	},
	orderItem: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
		flexDirection: 'column',
		gap: theme.spacing.sm,
		paddingBottom: theme.spacing.md,
	},
	quantity: {
		marginHorizontal: theme.spacing.md,
		minWidth: 20,
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
		flex: 1,
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	totalAmount: {
		color: theme.colors.primary,
	},
	totalRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	walletCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
}))
