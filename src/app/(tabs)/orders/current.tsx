import { useCallback, useEffect, useMemo } from 'react'
import { Alert, Platform, Pressable, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, Stack } from 'expo-router'
import Head from 'expo-router/head'
import * as StoreReview from 'expo-store-review'
import { StyleSheet } from 'react-native-unistyles'

import type { Product } from '@common/api'
import type { CreateOrder } from '@common/schemas'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { ModifierTag } from '@/components/ModifierTag'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Paragraph, Text } from '@/components/Text'
import { trackEvent } from '@/lib/analytics/firebase'
import { useProductDetails } from '@/lib/hooks/use-product-details'
import { useRegisterForPushNotifications } from '@/lib/notifications'
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
import { sortModifiers } from '@/lib/utils/modifier-tags'
import { formatPrice, getProductTotalCost } from '@/lib/utils/price'

import type { OrderProduct } from '@/lib/stores/order-store'

const IGNORED_MODIFICATION_GROUP_ID = '4'

type ModificationTag = {
	group: string
	modificationGroupId: string
	name: string
}

export default function OrderDetail() {
	const { t } = useLingui()
	const order = useCurrentOrder()
	const updateItem = useUpdateItem()
	const registerForPushNotifications = useRegisterForPushNotifications()

	const clearOrder = useClearOrder()
	const { data: user } = useQuery(selfQueryOptions)

	// Fetch missing product details
	const productIds = useMemo(
		() => [...new Set((order?.products ?? []).map((product) => product.id))],
		[order?.products],
	)
	const { getProductName } = useProductDetails(productIds)

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
			void trackEvent('purchase', {
				currency: 'MXN',
				price: orderTotal.toString(),
				quantity: order?.products
					.reduce((sum, product) => sum + product.quantity, 0)
					.toString(),
			})

			Burnt.toast({
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
				StoreReview.requestReview().catch(() => null)
			}

			router.back()
		},
	})

	// eslint-disable-next-line react-hooks/preserve-manual-memoization
	const orderTotal = useMemo(
		() => getOrderTotal(order?.products ?? []),
		[order?.products],
	)

	useEffect(() => {
		if (!order?.products) return

		void trackEvent('view_cart', {
			currency: 'MXN',
			price: orderTotal.toString(),
			quantity: order.products
				.reduce((sum, product) => sum + product.quantity, 0)
				.toString(),
		})
	}, [order?.products, orderTotal])

	const { Field, handleSubmit, Subscribe } = useForm({
		defaultValues: {
			// This will be set by the server
			client_id: Number.parseInt(user?.client_id as string, 10),
			comment: '',
			payment: { id: '', type: 'E_WALLET' as const },
			products:
				order?.products.map((product) => ({
					count: product.quantity,
					modifications: product.modifications,
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

			void trackEvent('begin_checkout', {
				currency: 'MXN',
				price: orderTotal.toString(),
				quantity: order?.products
					.reduce((sum, product) => sum + product.quantity, 0)
					.toString(),
			})

			const orderApiFormat = {
				...value,
				payment: { amount: orderTotal },
				products: value.products.map(
					({ modifications, ...product }) =>
						({
							...product,
							modification: Object.entries(modifications ?? {}).map(
								([, modificationId]) => ({
									a: 1,
									m: modificationId.toString(),
								}),
							),
						}) satisfies CreateOrder['products'][number],
				),
			} satisfies CreateOrder

			return createOrder(orderApiFormat)
		},
	})

	const handleQuantityChange = (product: OrderProduct, quantity: number) => {
		updateItem(product.id, product.modifications, quantity)
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
			<ScreenContainer
				contentContainerStyle={styles.container}
				keyboardAware
				withHeaderPadding
			>
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
					{order.products.map((product, index) =>
						renderOrderProduct(product, index),
					)}
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
									onChangeText={(text) => field.handleChange(text)}
									placeholder={t`Add any special instructions or requests...`}
									style={styles.notesInput}
									value={field.state.value}
								/>
							)}
						</Field>
					</Card>
				</View>

				<Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting] as const}
				>
					{([canSubmit, isSubmitting]) => {
						const hasInsufficientBalance =
							!user || Number(user.ewallet ?? '0') < orderTotal

						return (
							<Button
								disabled={!canSubmit || hasInsufficientBalance}
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
			</ScreenContainer>
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

const styles = StyleSheet.create((theme) => ({
	actionButtons: {
		flexDirection: 'row',
		gap: theme.spacing.md,
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
		color: theme.colors.crema.solid,
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
	totalAmount: {
		color: theme.colors.verde.solid,
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
}))
