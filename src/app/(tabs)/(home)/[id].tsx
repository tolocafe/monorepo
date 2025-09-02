import { useEffect } from 'react'
import {
	ActivityIndicator,
	RefreshControl,
	TouchableOpacity,
	View,
} from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import Animated from 'react-native-reanimated'
import {
	StyleSheet,
	UnistylesRuntime,
	withUnistyles,
} from 'react-native-unistyles'

import { Button } from '@/components/Button'
import HeaderGradient from '@/components/HeaderGradient'
import ScreenContainer from '@/components/ScreenContainer'
import { H1, H2, Label, Paragraph, Text } from '@/components/Text'
import { trackEvent } from '@/lib/firebase'
import { getImageUrl } from '@/lib/image'
import { useTabBarHeight } from '@/lib/navigation/tab-bar-height'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import { api } from '@/lib/services/api-service'
import { useAddItemGuarded } from '@/lib/stores/order-store'
import { formatCookingTime } from '@/lib/utils/cooking-time'
import { formatPrice } from '@/lib/utils/price'

const handleClose = () => {
	router.back()
}

const linearGradientColors = [
	'transparent',
	'rgba(0,0,0,0.4)',
	'rgba(0,0,0,0.85)',
] as const

const UniImage = withUnistyles(Image)

// eslint-disable-next-line unicorn/prevent-abbreviations
export async function generateStaticParams() {
	const products = await api.menu.getProducts()
	return products.map((products) => ({ id: products.product_id }))
}

export default function MenuDetail() {
	const { t } = useLingui()
	const tabBarHeight = useTabBarHeight()
	const { id } = useLocalSearchParams<{ id: string }>()

	const addItem = useAddItemGuarded()
	const { data: product, isPending } = useQuery(productQueryOptions(id))

	const { Field, handleSubmit, setFieldValue, Subscribe } = useForm({
		defaultValues: {
			modifications: {} as Record<string, number>,
			productId: id,
			quantity: 1,
		},
		onSubmit({ value }) {
			addItem({
				id: value.productId,
				quantity: value.quantity,
			})
		},
	})

	useEffect(() => {
		if (!product?.product_id) return

		void trackEvent('view_item', {
			item_id: product.product_id,
		})
	}, [product?.product_id])

	// Default each group to its first modification when product loads
	useEffect(() => {
		const groups = product?.group_modifications
		if (!groups?.length) return

		for (const group of groups) {
			if (group.modifications.length > 0) {
				setFieldValue(
					`modifications.${group.dish_modification_group_id}`,
					group.modifications[0].dish_modification_id,
				)
			}
		}
	}, [product?.group_modifications, setFieldValue])

	const incrementQuantity = () =>
		setFieldValue('quantity', (previous) => previous + 1)
	const decrementQuantity = () =>
		setFieldValue('quantity', (previous) => Math.max(1, previous - 1))

	if (!product) {
		if (isPending) {
			return (
				<ScreenContainer>
					<ActivityIndicator size="large" />
				</ScreenContainer>
			)
		}

		return (
			<ScreenContainer>
				<View style={styles.header}>
					<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
						<Ionicons
							color={styles.closeButtonText.color}
							name="close"
							size={20}
						/>
					</TouchableOpacity>
				</View>
				<View style={styles.content}>
					<H1 style={styles.title}>
						<Trans>Product not found</Trans>
					</H1>
					<Paragraph style={styles.description}>
						<Trans>The requested product could not be loaded.</Trans>
					</Paragraph>
				</View>
			</ScreenContainer>
		)
	}

	const unitPriceCents = Object.values(product.price ?? {}).at(0) ?? '0'
	const hasImage = product.photo_origin || product.photo

	return (
		<>
			<Head>
				<title>{t`${product.product_name} - TOLO Good Coffee`}</title>
			</Head>
			<HeaderGradient />
			<ScreenContainer
				contentContainerStyle={{ paddingBottom: tabBarHeight }}
				contentInsetAdjustmentBehavior="never"
				refreshControl={
					<RefreshControl
						onRefresh={() =>
							queryClient.invalidateQueries(productQueryOptions(id))
						}
						refreshing={false}
					/>
				}
			>
				<Animated.View
					sharedTransitionTag={`menu-item-${product.product_id}`}
					style={styles.heroImageContainer}
				>
					{hasImage ? (
						<UniImage
							contentFit="cover"
							placeholder={{
								cacheKey: `${product.product_id}-placeholder`,
								uri: getImageUrl(product.photo_origin || product.photo, {
									blur: 100,
									quality: 20,
									width: 350,
								}),
								width: UnistylesRuntime.screen.width,
							}}
							placeholderContentFit="cover"
							source={{
								uri: getImageUrl(product.photo_origin || product.photo, {
									quality: 90,
									width: 800,
								}),
							}}
							style={styles.image}
							transition={200}
						/>
					) : (
						<View aria-hidden style={{ height: '100%', width: '100%' }} />
					)}
					<LinearGradient
						colors={linearGradientColors}
						end={{ x: 0, y: 1 }}
						start={{ x: 0, y: 0 }}
						style={titleOverlayStyle}
					>
						<H1 style={styles.titleOverlayText}>{product.product_name}</H1>
					</LinearGradient>
				</Animated.View>

				<View style={styles.content}>
					<H2 style={styles.price}>{formatPrice(unitPriceCents)}</H2>

					{product['small-description'] && (
						<Paragraph style={styles.description}>
							{product['small-description']}
						</Paragraph>
					)}

					<View style={styles.badges}>
						{product.category_name ? (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{product.category_name}</Text>
							</View>
						) : null}
						{product.cooking_time && product.cooking_time !== '0' ? (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>
									{formatCookingTime(product.cooking_time)}
								</Text>
							</View>
						) : null}
						{product.out ? (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{product.out} ml</Text>
							</View>
						) : null}
					</View>

					{product.ingredients?.length && (
						<>
							<H2>
								<Trans>Ingredients</Trans>
							</H2>
							<View style={styles.ingredientsSection}>
								{product.ingredients.slice(0, 5).map((ingredient) => (
									<Paragraph
										key={ingredient.ingredient_id}
										style={styles.ingredient}
									>
										• {ingredient.ingredient_name}
									</Paragraph>
								))}
							</View>
						</>
					)}

					{/* Group Modifications */}
					{product.group_modifications &&
						product.group_modifications.length > 0 && (
							<>
								<H2>
									<Trans>Modifications</Trans>
								</H2>
								<View>
									{product.group_modifications.map((group) => {
										if (group.name.startsWith('Desechable')) return null

										return (
											<View
												key={group.dish_modification_group_id}
												style={styles.modGroup}
											>
												<Label style={styles.modGroupTitle}>{group.name}</Label>
												<Field
													name={`modifications.${group.dish_modification_group_id}`}
												>
													{(field) => (
														<View
															accessibilityRole="radiogroup"
															style={styles.modButtonGroup}
														>
															{group.modifications.map((modification) => {
																const isSelected =
																	field.state.value ===
																	modification.dish_modification_id

																return (
																	<TouchableOpacity
																		accessibilityRole="radio"
																		accessibilityState={{
																			selected: isSelected,
																		}}
																		key={modification.dish_modification_id}
																		onPress={() =>
																			field.handleChange(
																				modification.dish_modification_id,
																			)
																		}
																		style={styles.modButton}
																	>
																		<View style={styles.modButtonRow}>
																			{isSelected ? (
																				<View style={styles.modCheck}>
																					<Ionicons
																						color={styles.modCheckIcon.color}
																						name="checkmark"
																						size={14}
																					/>
																				</View>
																			) : null}
																			<Text style={styles.modButtonText}>
																				{modification.name}
																				{modification.price
																					? ` +${formatPrice(modification.price * 100)}`
																					: null}
																			</Text>
																		</View>
																	</TouchableOpacity>
																)
															})}
														</View>
													)}
												</Field>
											</View>
										)
									})}
								</View>
							</>
						)}

					{/* Single Modifications */}
					{product.modifications?.length && (
						<>
							<H2>
								<Trans>Modifications</Trans>
							</H2>
							<View style={styles.modButtonGroup}>
								{product.modifications.map((modification) => (
									<View
										key={modification.dish_modification_id}
										style={styles.modButtonRow}
									>
										<Paragraph style={styles.modButton}>
											{modification.modificator_name}
										</Paragraph>
									</View>
								))}
							</View>
						</>
					)}

					{/* Quantity Controls */}
					<View style={styles.quantitySection}>
						<Label style={styles.quantityLabel}>
							<Trans>Quantity</Trans>
						</Label>
						<View style={styles.quantityControls}>
							<TouchableOpacity
								onPress={decrementQuantity}
								style={styles.quantityButton}
							>
								<Ionicons color="#333" name="remove" size={20} />
							</TouchableOpacity>
							<Subscribe selector={(state) => state.values.quantity}>
								{(quantity) => (
									<Label style={styles.quantityText}>{quantity}</Label>
								)}
							</Subscribe>
							<TouchableOpacity
								onPress={incrementQuantity}
								style={styles.quantityButton}
							>
								<Ionicons color="#333" name="add" size={20} />
							</TouchableOpacity>
						</View>
					</View>

					<Subscribe selector={(state) => state.values.quantity}>
						{(quantity) => (
							<Button
								disabled={!(Number(unitPriceCents) * quantity)}
								onPress={handleSubmit}
							>
								<Trans>
									Add to Order -{' '}
									{formatPrice(Number(unitPriceCents) * quantity)}
								</Trans>
							</Button>
						)}
					</Subscribe>
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	badge: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.sm,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.xs,
	},
	badges: {
		flexDirection: 'row',
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.xl,
	},
	badgeText: {
		color: theme.colors.surface,
		fontSize: theme.fontSizes.sm,
		fontWeight: theme.fontWeights.semibold,
	},
	closeButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.full,
		elevation: 5,
		height: theme.spacing.xl,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			height: 2,
			width: 0,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		width: theme.spacing.xl,
	},
	closeButtonText: {
		color: theme.colors.text,
		fontSize: theme.fontSizes.lg,
		fontWeight: theme.fontWeights.bold,
	},
	content: {
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	description: {
		marginBottom: theme.spacing.lg,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		padding: theme.spacing.lg,
		position: 'absolute',
		right: 0,
		top: 40,
		zIndex: 1,
	},
	heroImageContainer: {
		backgroundColor: theme.colors.border,
		height: 300,
		position: 'relative',
		width: '100%',
	},
	image: {
		height: '100%',
		objectFit: 'cover',
		width: '100%',
	},
	ingredient: {
		color: theme.colors.textSecondary,
		paddingLeft: theme.spacing.sm,
	},
	ingredientsSection: {
		gap: theme.spacing.xs,
	},
	loadingText: {
		color: theme.colors.textSecondary,
	},
	modButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.full,
		borderWidth: 1,
		justifyContent: 'center',
		minHeight: 44,
		minWidth: 64,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.sm,
	},
	modButtonGroup: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
	},
	modButtonRow: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'space-between',
	},
	modButtonText: {
		fontSize: theme.typography.button.fontSize,
		fontWeight: theme.fontWeights.semibold,
	},
	modCheck: {
		alignItems: 'center',
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.full,
		height: 20,
		justifyContent: 'center',
		width: 20,
	},
	modCheckIcon: {
		color: '#FFFFFF',
	},
	modCheckPlaceholder: {
		height: 20,
		width: 20,
	},
	modGroup: {
		gap: theme.spacing.xs,
		marginBottom: theme.spacing.lg,
	},
	modGroupTitle: {
		marginBottom: theme.spacing.xs,
	},
	modificationsSection: {
		marginBottom: theme.spacing.xl,
	},
	modItemName: {
		flexShrink: 1,
		paddingRight: theme.spacing.md,
	},
	modItemPrice: {
		color: theme.colors.textSecondary,
	},
	modItemRow: {
		alignItems: 'center',
		borderBottomColor: theme.colors.border,
		borderBottomWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: theme.spacing.xs,
	},
	placeholderImage: {
		backgroundColor: theme.colors.border,
	},
	popularBadge: {
		backgroundColor: theme.colors.primary,
	},
	price: {
		color: theme.colors.primary,
		marginBottom: theme.spacing.lg,
	},
	quantityButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: 20,
		borderWidth: 1,
		height: 40,
		justifyContent: 'center',
		width: 40,
	},
	quantityControls: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.lg,
		justifyContent: 'center',
	},
	quantityLabel: {
		marginBottom: theme.spacing.sm,
	},
	quantitySection: {
		marginBottom: theme.spacing.lg,
	},
	quantityText: {
		minWidth: 40,
		textAlign: 'center',
	},

	title: {
		marginBottom: theme.spacing.sm,
	},

	titleOverlayText: {
		color: '#FFFFFF',
	},
}))

const titleOverlayStyle = {
	bottom: 0,
	left: 0,
	padding: 10,
	position: 'absolute',
	right: 0,
} as const
