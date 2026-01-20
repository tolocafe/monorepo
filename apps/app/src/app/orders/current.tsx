import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { Product } from '@tolo/common/api'
import type { CreateOrder } from '@tolo/common/schemas'
import { toast } from 'burnt'
import { router, Stack, useFocusEffect } from 'expo-router'
import Head from 'expo-router/head'
import { requestReview } from 'expo-store-review'
import { useCallback, useMemo } from 'react'
import { Alert, Platform, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import { Input } from '@/components/Input'
import { ModifierTag } from '@/components/ModifierTag'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Paragraph, Text } from '@/components/Text'
import { trackEvent } from '@/lib/analytics'
import { screen } from '@/lib/analytics/posthog'
import { ORDER_BUTTON_HEIGHT } from '@/lib/constants/ui'
import { useProductDetails } from '@/lib/hooks/use-product-details'
import { useRegisterForPushNotifications } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'
import {
	createOrderMutationOptions,
	orderQueryOptions,
	transactionQueryOptions,
} from '@/lib/queries/order'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import { api } from '@/lib/services/api-service'
import {
	useClearOrder,
	useOrderProducts,
	useTransactionId,
	useUpdateItem,
} from '@/lib/stores/order-store'
import type { OrderProduct } from '@/lib/stores/order-store'
import { sortModifiers } from '@/lib/utils/modifier-tags'
import { formatPrice, getProductTotalCost } from '@/lib/utils/price'

const IGNORED_MODIFICATION_GROUP_ID = '4'

type ModificationTag = {
	group: string
	modificationGroupId: string
	name: string
}

export default function OrderDetail() {
	const { t } = useLingui()
	const products = useOrderProducts()
	const transactionId = useTransactionId()
	const updateItem = useUpdateItem()
	const registerForPushNotifications = useRegisterForPushNotifications()

	const clearOrder = useClearOrder()
	const { data: user } = useQuery(selfQueryOptions)
	const { data: transaction } = useQuery(transactionQueryOptions(transactionId))

	const productIds = useMemo(
		() => [...new Set(products.map((product) => product.id))],
		[products],
	)
	const { getProductName } = useProductDetails(productIds)

	// Derive order properties from transaction or defaults
	const tableId = transaction?.table_id ?? null
	const guestsCount = transaction?.guests_count
		? Number(transaction.guests_count)
		: undefined

	const onOrderSuccess = useCallback(() => {
		toast({
			duration: 3,
			haptic: 'success',
			message: t`Thanks! We'll start preparing it now.`,
			preset: 'done',
			title: t`Order placed`,
		})

		void registerForPushNotifications()
		clearOrder()
		void queryClient.invalidateQueries(orderQueryOptions)

		if (Platform.OS !== 'web') {
			requestReview().catch(() => null)
		}

		router.back()
	}, [clearOrder, registerForPushNotifications, t])

	const onOrderError = useCallback(() => {
		toast({
			duration: 3,
			haptic: 'error',
			message: t`Failed to submit order. Please try again.`,
			preset: 'error',
			title: t`Error`,
		})
	}, [t])

	const { mutateAsync: createOrder } = useMutation({
		...createOrderMutationOptions,
		onError: onOrderError,
		onSuccess: onOrderSuccess,
	})

	const { mutateAsync: addTransactionProducts } = useMutation({
		mutationFn: (data: {
			products: {
				count: number
				modification?: { a: number; m: string }[]
				product_id: string
			}[]
			transactionId: string
		}) => api.transactions.addProducts(data.transactionId, data.products),
		onError: onOrderError,
		onSuccess: onOrderSuccess,
	})

	const orderTotal = useMemo(() => getOrderTotal(products), [products])

	useFocusEffect(
		useCallback(() => {
			if (products.length === 0) return

			const itemCount = products.reduce(
				(sum, product) => sum + product.quantity,
				0,
			)

			screen('cart', {
				cart_total: orderTotal,
				currency: 'MXN',
				item_count: itemCount,
			})
		}, [products, orderTotal]),
	)

	const { Field, handleSubmit, Subscribe } = useForm({
		defaultValues: {
			client_id: Number(user?.client_id as string),
			comment: '',
			payment: { id: '', type: 'E_WALLET' as const },
			products: products.map((product) => ({
				count: product.quantity,
				modifications: product.modifications,
				product_id: product.id,
			})),
			serviceMode: tableId ? 1 : 2,
		},
		onSubmit({ value }) {
			const hasInsufficientBalance =
				!user || Number(user.ewallet ?? '0') < orderTotal
			const isTakeIn = Boolean(transactionId)

			const itemCount = products.reduce(
				(sum, product) => sum + product.quantity,
				0,
			)

			// Only block checkout for insufficient balance if NOT a take-in order
			if (hasInsufficientBalance && !isTakeIn) {
				trackEvent('checkout:insufficient_balance', {
					available_balance: Number(user?.ewallet ?? '0'),
					required_amount: orderTotal,
				})

				Alert.alert(
					t`Insufficient Balance`,
					t`You don't have enough balance in your wallet. Please top up your wallet first.`,
					[
						{
							onPress: () => router.push('/profile/top-up'),
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

			trackEvent('checkout:start', {
				cart_total: orderTotal,
				currency: 'MXN',
				item_count: itemCount,
			})

			// Format products for API
			const formattedProducts = value.products.map(
				({ modifications, ...product }) => ({
					...product,
					modification: Object.entries(modifications ?? {}).map(
						([, modificationId]) => ({
							a: 1,
							m: modificationId.toString(),
						}),
					),
				}),
			)

			// For take-in orders with existing transaction, add products to transaction
			if (transactionId) {
				return addTransactionProducts({
					products: formattedProducts,
					transactionId,
				})
			}

			// For to-go orders, create a new order
			const orderApiFormat = {
				...value,
				guests_count: guestsCount,
				payment: { amount: orderTotal },
				products: formattedProducts as CreateOrder['products'],
				table_id: tableId,
			} satisfies CreateOrder

			return createOrder(orderApiFormat)
		},
	})

	const handleQuantityChange = (
		product: OrderProduct,
		nextQuantity: number,
	) => {
		const previousQuantity = product.quantity

		if (nextQuantity <= 0) {
			trackEvent('cart:item_remove', {
				product_id: product.id,
			})
		} else if (nextQuantity !== previousQuantity) {
			trackEvent('cart:item_quantity_update', {
				new_quantity: nextQuantity,
				old_quantity: previousQuantity,
				product_id: product.id,
			})
		}

		updateItem(product.id, product.modifications, nextQuantity)
	}

	const handleClearOrder = useCallback(() => {
		if (Platform.OS === 'web') {
			clearOrder()
			router.back()
			return
		}

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
	}, [clearOrder, t])

	const renderOrderProduct = (product: OrderProduct, index: number) => {
		const modificationTags = Object.entries(product.modifications ?? {})
			.filter(
				([groupModificationId]) =>
					groupModificationId !== IGNORED_MODIFICATION_GROUP_ID,
			)
			.map(([modificationGroupId, modificationId]) =>
				getModificationTag({
					modificationGroupId,
					modificationId,
					product,
				}),
			)
			.filter((tag): tag is ModificationTag => tag !== null)

		const sortedTags = sortModifiers(modificationTags)

		return (
			<View key={`${product.id}-${index}`} style={styles.orderItem}>
				<View style={styles.itemHeader}>
					<Paragraph style={styles.itemName}>
						{getProductName(product.id)}
					</Paragraph>
				</View>

				<View style={styles.itemDetails}>
					<View style={styles.quantityContainer}>
						<Pressable
							onLongPress={() => handleQuantityChange(product, 0)}
							onPress={() =>
								handleQuantityChange(product, product.quantity - 1)
							}
							style={styles.quantityButton}
						>
							<Text>
								<Ionicons name="remove" size={20} />
							</Text>
						</Pressable>
						<Text align="center" style={styles.quantity}>
							{product.quantity}
						</Text>
						<Pressable
							onPress={() =>
								handleQuantityChange(product, product.quantity + 1)
							}
							style={styles.quantityButton}
						>
							<Text>
								<Ionicons name="add" size={20} />
							</Text>
						</Pressable>
					</View>
					<Paragraph>
						{formatPrice(
							getProductTotalCost({
								modifications: product.modifications ?? {},
								product: product.id,
								quantity: product.quantity,
							}),
						)}
					</Paragraph>
				</View>

				{sortedTags.length > 0 && (
					<View style={styles.modifications}>
						{sortedTags.map((tag) => (
							<ModifierTag
								group={tag.group}
								key={tag.modificationGroupId}
								name={tag.name}
							/>
						))}
					</View>
				)}
			</View>
		)
	}

	// Show empty state if no products and no active transaction
	if (products.length === 0 && !transactionId) {
		return (
			<>
				<Head>
					<title>{t`Order Not Found`}</title>
				</Head>

				<View style={styles.emptyContainer}>
					<Paragraph style={styles.emptyText}>
						<Trans>The requested order could not be found.</Trans>
					</Paragraph>
				</View>
			</>
		)
	}

	const handleClose = () => {
		router.back()
	}

	return (
		<>
			<Head>
				<title>{t`Current Order`}</title>
			</Head>

			{Platform.OS !== 'ios' && (
				<Stack.Screen
					options={{
						headerRight: () => (
							<Button variant="surface" onPress={handleClearOrder}>
								<Trans>Clear</Trans>
							</Button>
						),
					}}
				/>
			)}
			<Stack.Header>
				<Stack.Header.Title>{t`Current Order`}</Stack.Header.Title>
				<Stack.Header.Left>
					<Stack.Header.Button icon="xmark" onPress={handleClose} />
				</Stack.Header.Left>
				<Stack.Header.Right>
					<Stack.Header.Button icon="trash" onPress={handleClearOrder}>
						<Trans>Clear</Trans>
					</Stack.Header.Button>
				</Stack.Header.Right>
			</Stack.Header>

			<ScreenContainer contentContainerStyle={styles.container} keyboardAware>
				{user && (
					<>
						<H2>
							<Trans>Payment</Trans>
						</H2>
						<Card style={styles.walletCard}>
							<Text>
								<Trans>Wallet Balance</Trans>
							</Text>
							<Text weight="bold">{formatPrice(user.ewallet ?? '0')}</Text>
						</Card>
					</>
				)}

				<H2>
					<Trans>Items</Trans>
				</H2>

				<Card style={styles.itemsCard}>
					{products.map((product, index) => renderOrderProduct(product, index))}
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
						<Text weight="bold">
							<Trans>Comments</Trans>
						</Text>
						<Field
							name="comment"
							validators={{
								onChange({ value }) {
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
									onChangeText={(text: string) => field.handleChange(text)}
									placeholder={t`Add any special instructions or requests...`}
									style={styles.notesInput}
									value={field.state.value}
								/>
							)}
						</Field>
					</Card>
				</View>
			</ScreenContainer>
			<Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting] as const}
			>
				{([canSubmit, isSubmitting]) => {
					const hasInsufficientBalance =
						!user || Number(user.ewallet ?? '0') < orderTotal
					const isTakeIn = Boolean(transactionId)

					// Only disable button for insufficient balance if NOT a take-in order
					const shouldDisable =
						!canSubmit || (hasInsufficientBalance && !isTakeIn)

					return (
						<View style={styles.bottomButton}>
							<Button
								disabled={shouldDisable}
								onPress={handleSubmit}
								style={styles.sendButton}
							>
								<Button.Text style={styles.whiteText}>
									{isSubmitting ? (
										<Trans>Sending Order...</Trans>
									) : (
										<Trans>Send Order</Trans>
									)}
								</Button.Text>
							</Button>
						</View>
					)
				}}
			</Subscribe>
		</>
	)
}

function getModificationTag({
	modificationGroupId,
	modificationId,
	product,
}: {
	modificationGroupId: string
	modificationId: number
	product: OrderProduct
}): ModificationTag | null {
	const productData = queryClient.getQueryData<Product>(
		productQueryOptions(product.id).queryKey,
	)

	if (!productData) return null

	const modificationGroup = productData.group_modifications?.find(
		(modification) =>
			modification.dish_modification_group_id.toString() ===
			modificationGroupId,
	)

	const modification = modificationGroup?.modifications?.find(
		(modification) => modification.dish_modification_id === modificationId,
	)

	if (!modification?.name) return null

	return {
		group: modificationGroup?.name || 'Other',
		modificationGroupId,
		name: modification.name,
	}
}

function getOrderTotal(products: OrderProduct[]) {
	return products.reduce((orderTotal, item) => {
		const productData = queryClient.getQueryData<Product>(
			productQueryOptions(item.id).queryKey,
		) as Product

		const unitPriceCents = getProductTotalCost({
			modifications: item.modifications ?? {},
			product: productData,
			quantity: item.quantity,
		})

		return orderTotal + unitPriceCents
	}, 0)
}

const styles = StyleSheet.create((theme, runtime) => ({
	bottomButton: {
		alignItems: 'center',
		bottom: Math.max(runtime.insets.bottom, theme.layout.screenPadding),
		flexDirection: 'row',
		left: theme.layout.screenPadding,
		position: 'absolute',
		right: theme.layout.screenPadding,
	},
	container: {
		gap: theme.spacing.md,
	},
	emptyContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		padding: theme.spacing.xl,
	},
	emptyText: {
		color: theme.colors.gray.solid,
		textAlign: 'center',
	},
	itemDetails: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	itemHeader: {
		flexDirection: 'row',
	},
	itemName: {
		flex: 1,
		fontWeight: theme.fontWeights.bold,
	},
	itemsCard: {
		gap: theme.spacing.md,
		paddingTop: theme.spacing.md,
	},
	modifications: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.xs,
		marginBottom: theme.spacing.sm,
	},
	noteSection: {
		gap: theme.spacing.md,
	},
	notesInput: {
		marginVertical: theme.spacing.sm,
	},
	orderItem: {
		gap: theme.spacing.sm,
	},
	quantity: {
		marginHorizontal: theme.spacing.md,
		minWidth: 20,
	},
	quantityButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
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
	sendButton: {
		backgroundColor: theme.colors.primary.solid,
		borderRadius: theme.borderRadius.full,
		height: ORDER_BUTTON_HEIGHT,
		width: '100%',
	},
	totalAmount: {
		color: theme.colors.primary.solid,
	},
	totalRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: theme.spacing.sm,
	},
	walletCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: theme.spacing.md,
	},
	whiteText: {
		color: '#FFFFFF',
	},
}))
