import { useCallback, useEffect } from 'react'
import {
	ActivityIndicator,
	Platform,
	Pressable,
	RefreshControl,
	View,
} from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useAutoheight } from '@formidable-webview/webshell'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withSpring,
} from 'react-native-reanimated'
import {
	StyleSheet,
	UnistylesRuntime,
	useUnistyles,
	withUnistyles,
} from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { CheckedButton } from '@/components/CheckedButton'
import { HeaderIconIonicons } from '@/components/Icons'
import { LevelIndicator } from '@/components/LevelIndicator'
import { LinearGradient } from '@/components/LinearGradient'
import ScreenContainer from '@/components/ScreenContainer'
import { H1, H2, H3, Paragraph, Text } from '@/components/Text'
import WebContent from '@/components/WebContent'
import { trackEvent } from '@/lib/analytics/firebase'
import { getImageUrl } from '@/lib/image'
import { selfQueryOptions } from '@/lib/queries/auth'
import { productQueryOptions } from '@/lib/queries/product'
import { queryClient } from '@/lib/query-client'
import { api } from '@/lib/services/api-service'
import { useAddItemGuarded } from '@/lib/stores/order-store'
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
		scalesPageToFit: false,
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

	// Hopefully at some point we can add the title to the static params
	return products.map((products) => ({ id: products.product_id }))
}

const RECIPE_GROUPS = new Set([8, 9])

const gradient = {
	end: { x: 0, y: 1 },
	start: { x: 0, y: 0 },
}

const PADDING_EDGES = ['bottom'] as const

const GrayIonIcon = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.text,
}))

export default function MenuDetail() {
	const { t } = useLingui()

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
			if (Platform.OS !== 'web') {
				void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
			}

			const success = addItem({
				id: value.productId,
				modifications: value.modifications,
				quantity: value.quantity,
			})

			if (success) {
				router.back()
			}
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
			if (group.modifications?.length) {
				setFieldValue(
					`modifications.${group.dish_modification_group_id}`,
					group.modifications[0].dish_modification_id,
				)
			}
		}
	}, [product?.group_modifications, setFieldValue])

	const { autoheightWebshellProps } = useAutoheight(config)

	const htmlDescriptionSource = useGetFormattedHTMLContent(product?.description)
	const htmlRecipeSource = useGetFormattedHTMLContent(product?.recipe)

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
				<ScreenContainer data-testid="loading">
					<ActivityIndicator size="large" />
				</ScreenContainer>
			)
		}

		return (
			<ScreenContainer>
				<View style={styles.header}>
					<Pressable onPress={handleClose} style={styles.closeButton}>
						<GrayIonIcon name="close" size={20} />
					</Pressable>
				</View>
				<View style={styles.content}>
					<H1>
						<Trans>Product not found</Trans>
					</H1>
					<Paragraph>
						<Trans>The requested product could not be loaded.</Trans>
					</Paragraph>
				</View>
			</ScreenContainer>
		)
	}

	const hasImage = product.photo_origin || product.photo

	const groupModifications = product.group_modifications
		?.filter(
			(group) =>
				group.modifications?.length && !group.name.startsWith('Desechable'),
		)
		.map((group) => ({
			...group,
			name: group.name
				.replace(/^Leche .*/, 'Leche')
				.replace(/^Temperatura .*/, 'Temperatura'),
		}))

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
								<HeaderIconIonicons name="close-outline" size={35} />
							</Pressable>
						),
					}),
				}}
			/>
			<ScreenContainer
				refreshControl={
					<RefreshControl
						onRefresh={() =>
							queryClient.invalidateQueries(productQueryOptions(id))
						}
						refreshing={false}
					/>
				}
				withHeaderPadding
				withPaddingEdges={PADDING_EDGES}
				withTopGradient={Platform.OS !== 'ios'}
			>
				<View style={styles.heroImageContainer}>
					{hasImage ? (
						<UniImage
							contentFit="cover"
							placeholder={{
								cacheKey: `${product.product_id}-placeholder`,
								uri: getImageUrl(product.photo_origin || product.photo, {
									blur: 100,
									quality: 20,
									source: 'poster',
									width: 350,
								}),
								width: UnistylesRuntime.screen.width,
							}}
							placeholderContentFit="cover"
							source={{
								uri: getImageUrl(product.photo_origin || product.photo, {
									quality: 85,
									source: 'poster',
									width: 900,
								}),
							}}
							style={styles.image}
							transition={200}
						/>
					) : (
						<View aria-hidden style={styles.imageFallback} />
					)}
					<LinearGradient
						colors={linearGradientColors}
						end={gradient.end}
						start={gradient.start}
						style={titleOverlayStyle}
					>
						<H1 style={styles.titleOverlayText}>{product.product_name}</H1>
					</LinearGradient>
				</View>

				<View style={styles.content}>
					<View style={styles.productInfo}>
						<H2 style={styles.price}>{getProductBaseCost(product)}</H2>

						{htmlDescriptionSource ? (
							<WebContent
								{...autoheightWebshellProps}
								source={htmlDescriptionSource}
							/>
						) : product['small-description'] ? (
							<Paragraph>{product['small-description']}</Paragraph>
						) : null}

						{Boolean(product.volume || product.calories) && (
							<View style={styles.badges}>
								{product.volume ? (
									<View style={styles.badge}>
										<Text style={styles.badgeText}>{product.volume} ml</Text>
									</View>
								) : null}
								{product.calories ? (
									<View style={styles.badge}>
										<Text style={styles.badgeText}>{product.calories} Cal</Text>
									</View>
								) : null}
							</View>
						)}

						{(product.intensity || product.caffeine) && (
							<View style={styles.levels}>
								<LevelIndicator
									label={t`Intensity`}
									level={product.intensity}
								/>
							</View>
						)}
						<LevelIndicator label={t`Caffeine`} level={product.caffeine} />
					</View>

					{htmlRecipeSource &&
					RECIPE_GROUPS.has(Number(selfData?.client_groups_id)) ? (
						<View style={styles.section}>
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
					{groupModifications && groupModifications.length > 0 && (
						<View style={styles.section}>
							<H2>
								<Trans>Modifications</Trans>
							</H2>
							<View>
								{groupModifications.map((group) => (
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
													{group.modifications?.map((modification) => {
														const isSelected =
															state.value === modification.dish_modification_id

														return (
															<CheckedButton
																accessibilityRole="radio"
																checked={isSelected}
																key={modification.dish_modification_id}
																onPress={() =>
																	handleChange(
																		modification.dish_modification_id,
																	)
																}
																right={
																	modification.price
																		? `+${formatPrice(
																				modification.price * 100,
																			)}`
																		: null
																}
															>
																{modification.name}
															</CheckedButton>
														)
													})}
												</View>
											)}
										</Field>
									</View>
								))}
							</View>
						</View>
					)}

					{product.modifications?.length && (
						<>
							<H2>
								<Trans>Modifications</Trans>
							</H2>
							<Field name="modifications">
								{({ handleChange, state }) => (
									<View style={styles.modButtonGroup}>
										{product.modifications?.map((modification) => {
											const isSelected =
												state.value[modification.modificator_name] ===
												modification.dish_modification_id

											return (
												<CheckedButton
													checked={isSelected}
													key={modification.dish_modification_id}
													onPress={() =>
														handleChange({
															...state.value,
															[modification.modificator_name]:
																modification.dish_modification_id,
														})
													}
													right={
														modification.price
															? `+${formatPrice(modification.price * 100)}`
															: null
													}
												>
													{modification.modificator_name}
												</CheckedButton>
											)
										})}
									</View>
								)}
							</Field>
						</>
					)}
				</View>
			</ScreenContainer>
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
						<View style={styles.bottomButton}>
							<View style={styles.quantityButtons}>
								{quantity > 1 && (
									<Pressable
										onPress={decrementQuantity}
										style={styles.quantityButtonMinus}
									>
										<Text style={styles.whiteText}>
											<Ionicons name="remove" size={26} />
										</Text>
									</Pressable>
								)}
								<Pressable
									onPress={incrementQuantity}
									style={[
										styles.quantityButton,
										quantity === 1 && styles.quantityButtonSingle,
									]}
								>
									<Text style={styles.whiteText}>
										<Ionicons name="add" size={26} />
									</Text>
								</Pressable>
							</View>
							<Button
								asChild
								disabled={!totalCost}
								onPress={handleSubmit}
								style={styles.addButton}
							>
								<View style={styles.buttonContent}>
									<Button.Text style={styles.whiteText}>
										<Trans>Add to Order</Trans>
									</Button.Text>
									{quantity > 1 && (
										<Button.Text style={[styles.quantityText]}>
											{quantity}
										</Button.Text>
									)}
								</View>
								<AnimatedPrice>{formatPrice(totalCost)}</AnimatedPrice>
							</Button>
						</View>
					)
				}}
			</Subscribe>
		</>
	)
}

function AnimatedPrice({ children }: { children: string }) {
	const priceScale = useSharedValue(1)

	useEffect(() => {
		priceScale.set(
			withSequence(
				withSpring(1.2, {
					mass: 1,
					stiffness: 900,
				}),
				withSpring(1, {
					mass: 1,
					stiffness: 900,
				}),
			),
		)

		return () => {
			cancelAnimation(priceScale)
		}
	}, [children, priceScale])

	const animatedPriceStyle = useAnimatedStyle(() => ({
		transform: [{ scale: priceScale.value }],
	}))

	return (
		<Animated.View style={animatedPriceStyle}>
			<Button.Text style={[styles.whiteText, { paddingHorizontal: 5 }]}>
				{children}
			</Button.Text>
		</Animated.View>
	)
}

function useGetFormattedHTMLContent(description: string | undefined) {
	const { theme } = useUnistyles()

	if (!description) return

	return {
		html: `
			<style>
				* {
					margin: 0;
					padding: 0;
					font-size: 16px;
					line-height: 1.4;
					font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
					color: var(--colors-gray-text);
				}
				html {
					color: ${theme.colors.gray.text};
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
					width: 1em;
					height: 1em;
				}
			</style>
			<body>
				${description}
			</body>
		`,
	}
}

const styles = StyleSheet.create((theme, runtime) => ({
	addButton: {
		flex: 1,
		flexDirection: 'row',
		height: 45,
		justifyContent: 'space-between',
	},
	badge: {
		backgroundColor: theme.colors.gray.solid,
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
		color: '#FFFFFF',
		fontSize: theme.fontSizes.sm,
		fontWeight: theme.fontWeights.semibold,
	},
	bottomButton: {
		alignItems: 'center',
		bottom: Platform.select({
			default: theme.spacing.md,
			ios: runtime.insets.bottom,
		}),
		flexDirection: 'row',
		gap: theme.spacing.sm,
		left: theme.layout.screenPadding,
		position: 'absolute',
		right: theme.layout.screenPadding,
	},
	buttonContent: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
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
	content: {
		_web: {
			paddingBottom: 50,
		},
		gap: theme.spacing.xxl,
		padding: theme.layout.screenPadding,
		paddingBottom: Platform.select({
			android: 40,
			default: theme.layout.screenPadding,
		}),
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
	imageFallback: { height: '100%', width: '100%' },
	levels: {
		gap: theme.spacing.md,
	},
	modButtonGroup: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.xs,
	},
	modGroup: {
		gap: theme.spacing.xs,
		marginBottom: theme.spacing.lg,
	},
	modGroupTitle: {
		marginBottom: theme.spacing.xs,
	},
	price: {
		color: theme.colors.verde.solid,
	},
	productInfo: {
		gap: theme.spacing.md,
	},
	quantityButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.verde.solid,
		borderBottomRightRadius: theme.borderRadius.full,
		borderTopRightRadius: theme.borderRadius.full,
		height: 45,
		justifyContent: 'center',
		width: 45,
	},
	quantityButtonMinus: {
		alignItems: 'center',
		backgroundColor: theme.colors.verde.solid,
		borderBottomLeftRadius: theme.borderRadius.full,
		borderTopLeftRadius: theme.borderRadius.full,
		height: 45,
		justifyContent: 'center',
		width: 45,
	},
	quantityButtons: {
		flexDirection: 'row',
	},
	quantityButtonSingle: {
		borderBottomLeftRadius: theme.borderRadius.full,
		borderTopLeftRadius: theme.borderRadius.full,
	},
	quantityText: {
		backgroundColor: theme.colors.verde.interactive,
		borderRadius: theme.borderRadius.full,
		paddingHorizontal: theme.spacing.sm,
	},
	recipeSection: {
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
	},
	section: {
		gap: theme.spacing.sm,
	},
	titleOverlayText: {
		color: '#FFFFFF',
	},
	whiteText: {
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
