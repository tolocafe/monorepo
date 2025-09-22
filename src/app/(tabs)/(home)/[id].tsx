import { useCallback, useEffect, useMemo } from 'react'
import {
	ActivityIndicator,
	Platform,
	Pressable,
	RefreshControl,
	TouchableOpacity,
	View,
} from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useAutoheight } from '@formidable-webview/webshell'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, Stack, useLocalSearchParams } from 'expo-router'
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
import { H1, H2, H3, Label, Paragraph, Text } from '@/components/Text'
import WebContent from '@/components/WebContent'
import { trackEvent } from '@/lib/analytics/firebase'
import { getImageUrl } from '@/lib/image'
import { useTabBarHeight } from '@/lib/navigation/tab-bar-height'
import { selfQueryOptions } from '@/lib/queries/auth'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import { api } from '@/lib/services/api-service'
import { useAddItemGuarded } from '@/lib/stores/order-store'
import { formatCookingTime } from '@/lib/utils/cooking-time'
import {
	formatPrice,
	getProductBaseCost,
	getProductTotalCost,
} from '@/lib/utils/price'

const handleClose = () => {
	router.back()
}

const linearGradientColors = [
	'transparent',
	'rgba(0,0,0,0.4)',
	'rgba(0,0,0,0.85)',
] as const

const UniImage = withUnistyles(Image)

const config = {
	initialHeight: 50,
	webshellProps: {
		contentMode: 'mobile' as const,
		disableScrollViewPanResponder: true,
		javaScriptEnabled: false,
		scalesPageToFit: true,
		showsVerticalScrollIndicator: false,
		style: {
			backgroundColor: 'transparent',
		},
		webshellDebug: false,
	},
} satisfies Parameters<typeof useAutoheight>[0]

// eslint-disable-next-line unicorn/prevent-abbreviations
export async function generateStaticParams() {
	const products = await api.menu.getProducts()
	return products.map((products) => ({ id: products.product_id }))
}

const RECIPE_GROUPS = new Set([8, 9])

export default function MenuDetail() {
	const { t } = useLingui()
	const tabBarHeight = useTabBarHeight()
	const { id } = useLocalSearchParams<{ id: string }>()
	const { data: selfData } = useQuery(selfQueryOptions)

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
				modifications: value.modifications,
				quantity: value.quantity,
			})
		},
	})

	/** Track view item event */
	useEffect(() => {
		if (!product?.product_id) return
		void trackEvent('view_item', { item_id: product.product_id })
	}, [product?.product_id])

	/** Default each group to its first modification when product loads */
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

	const { autoheightWebshellProps } = useAutoheight(config)

	const htmlDescriptionSource = useMemo(
		() =>
			product?.description
				? { html: getFormattedHTMLContent(product.description) }
				: undefined,
		[product?.description],
	)
	const htmlRecipeSource = useMemo(
		() =>
			product?.recipe
				? { html: getFormattedHTMLContent(product.recipe) }
				: undefined,
		[product?.recipe],
	)

	const incrementQuantity = useCallback(
		() => setFieldValue('quantity', (previous) => previous + 1),
		[setFieldValue],
	)

	const decrementQuantity = useCallback(
		() => setFieldValue('quantity', (previous) => Math.max(1, previous - 1)),
		[setFieldValue],
	)

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
					<H1>
						<Trans>Product not found</Trans>
					</H1>
					<Paragraph style={styles.description}>
						<Trans>The requested product could not be loaded.</Trans>
					</Paragraph>
				</View>
			</ScreenContainer>
		)
	}

	const hasImage = product.photo_origin || product.photo

	return (
		<>
			<Head>
				<title>{t`${product.product_name} - TOLO Good Coffee`}</title>
			</Head>
			<Stack.Screen
				options={{
					headerRight: Platform.select({
						default: undefined,
						ios: () => (
							<Pressable onPress={handleClose}>
								<Ionicons
									color={Platform.select({
										android: 'white',
										default: styles.closeButtonText.color,
									})}
									name="close-outline"
									size={35}
								/>
							</Pressable>
						),
					}),
				}}
			/>
			{Platform.select({ default: <HeaderGradient />, ios: undefined })}
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
									quality: 85,
									width: 900,
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
					<H2 style={styles.price}>{getProductBaseCost(product)}</H2>

					{htmlDescriptionSource ? (
						<WebContent
							{...autoheightWebshellProps}
							source={htmlDescriptionSource}
						/>
					) : product['small-description'] ? (
						<Paragraph style={styles.description}>
							{product['small-description']}
						</Paragraph>
					) : null}

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

					{htmlRecipeSource &&
					RECIPE_GROUPS.has(Number(selfData?.client_groups_id)) ? (
						<View>
							<H2>
								<Trans>Recipe</Trans>
							</H2>
							<View style={styles.recipeSection}>
								<WebContent
									{...autoheightWebshellProps}
									source={htmlRecipeSource}
								/>
							</View>
						</View>
					) : null}

					{/* Group Modifications */}
					{product.group_modifications &&
						product.group_modifications.length > 0 && (
							<View>
								<H2>
									<Trans>Modifications</Trans>
								</H2>
								<View>
									{product.group_modifications.map((group) => {
										if (group.name.startsWith('Desechable'))
											return (
												<View
													aria-hidden
													key={group.dish_modification_group_id}
												/>
											)

										return (
											<View
												key={group.dish_modification_group_id}
												style={styles.modGroup}
											>
												<H3 style={styles.modGroupTitle}>{group.name}</H3>
												<Field
													name={`modifications.${group.dish_modification_group_id}`}
												>
													{({ handleChange, state }) => (
														<View
															accessibilityRole="radiogroup"
															style={styles.modButtonGroup}
														>
															{group.modifications.map((modification) => {
																const isSelected =
																	state.value ===
																	modification.dish_modification_id

																return (
																	<TouchableOpacity
																		accessibilityRole="radio"
																		accessibilityState={{
																			selected: isSelected,
																		}}
																		key={modification.dish_modification_id}
																		onPress={() =>
																			handleChange(
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
																						size={16}
																					/>
																				</View>
																			) : null}
																			<Text style={styles.modButtonText}>
																				{modification.name}
																			</Text>
																			{modification.price ? (
																				<Text
																					style={[
																						styles.modButtonText,
																						styles.modItemPrice,
																					]}
																				>
																					+
																					{formatPrice(
																						modification.price * 100,
																					)}
																				</Text>
																			) : null}
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
							</View>
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

					<Subscribe
						selector={({ values }) =>
							[values.quantity, values.modifications] as const
						}
					>
						{([quantity, modifications]) => {
							const totalCost = getProductTotalCost({
								modifications,
								product,
								quantity,
							})

							return (
								<Button disabled={!totalCost} onPress={handleSubmit}>
									<Trans>Add to Order - {formatPrice(totalCost)}</Trans>
								</Button>
							)
						}}
					</Subscribe>
				</View>
			</ScreenContainer>
		</>
	)
}

function getFormattedHTMLContent(description: string) {
	return `
	<style>
		* {
			margin: 0;
			padding: 0;
			font-size: 16px;
			line-height: 1.4;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
			color: var(--colors-gray-text);
		}
		p {
			margin: 0;
		}
		ul, ol {
			padding-left: 1em;
		}
		h1,h2,h3,h4,h5,h6 {
			margin-bottom: 0.5em;
		}
		li::marker {
			display: block;
			background-color: red;
			width: 1em;
			height: 1em;
		}
	</style>
	${description}`
}

const styles = StyleSheet.create((theme) => ({
	badge: {
		backgroundColor: theme.colors.verde.solid,
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
		color: theme.colors.gray.background,
		fontSize: theme.fontSizes.sm,
		fontWeight: theme.fontWeights.semibold,
	},
	closeButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
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
		color: theme.colors.gray.text,
		fontSize: theme.fontSizes.lg,
		fontWeight: theme.fontWeights.bold,
	},
	content: {
		gap: theme.spacing.lg,
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
		backgroundColor: theme.colors.gray.border,
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
		paddingLeft: theme.spacing.sm,
	},
	ingredientsSection: {
		gap: theme.spacing.xs,
	},
	loadingText: {
		color: theme.colors.crema.solid,
	},
	modButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
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
		backgroundColor: theme.colors.verde.solid,
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
		color: theme.colors.verde.solid,
	},
	modItemRow: {
		alignItems: 'center',
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: theme.spacing.xs,
	},
	placeholderImage: {
		backgroundColor: theme.colors.gray.border,
	},
	popularBadge: {
		backgroundColor: theme.colors.verde.solid,
	},
	price: {
		color: theme.colors.verde.solid,
		marginBottom: theme.spacing.lg,
	},
	quantityButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
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
	recipeSection: {
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
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
