import { useCallback, useMemo, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'
import {
	Pressable,
	RefreshControl,
	ScrollView as RNScrollView,
	View,
} from 'react-native'

import { Feather, Ionicons } from '@expo/vector-icons'
import { Trans, useLingui } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { Card } from '@/components/Card'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, H3, Paragraph, Text } from '@/components/Text'
import { baristaQueueQueryOptions } from '@/lib/queries/barista'
import {
	categoriesQueryOptions,
	productsQueryOptions,
} from '@/lib/queries/menu'
import { queryClient } from '@/lib/query-client'

const POLLING_INTERVAL = 5000 // 5 seconds

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
	Café: '#6F4E37', // Brown for coffee
	Chocolate: '#5D4037', // Dark brown for chocolate
	'De Temporada': '#FF6B6B', // Coral/pink for seasonal
	Extras: '#9E9E9E', // Gray for extras/sides
	Matcha: '#4CAF50', // Green for matcha
	Panadería: '#D4A574', // Tan/bread color
	'Té y Tisanas': '#FFB74D', // Amber/orange for tea
}

const DEFAULT_CATEGORY_COLOR = '#8E8E93' // Gray fallback

// Modifier colors by name (specific modifiers)
const MODIFIER_NAME_COLORS = {
	// Milk types
	Avena: { bg: '#EFEBE9', text: '#6D4C41' }, // Brown for oat
	// Temperature - hot (red)
	Caliente: { bg: '#FFEBEE', text: '#D32F2F' },
	// Matcha grades (green)
	Ceremonial: { bg: '#E8F5E9', text: '#388E3C' },

	Deslactosada: { bg: '#FCE4EC', text: '#C2185B' }, // Pink for lactose-free
	Doble: { bg: '#E1BEE7', text: '#6A1B9A' },
	Entera: { bg: '#E3F2FD', text: '#1565C0' }, // Blue for whole milk

	'Extra Caliente': { bg: '#FFCDD2', text: '#C62828' },
	// Temperature - cold (blue)
	Frío: { bg: '#E3F2FD', text: '#1976D2' },

	Imperial: { bg: '#C8E6C9', text: '#2E7D32' },
	// Neutral
	Natural: { bg: '#FAFAFA', text: '#616161' },

	// Extras (purple)
	'Una adicional': { bg: '#F3E5F5', text: '#7B1FA2' },
} satisfies Record<string, { bg: string; text: string }>

// Modifier colors by group/category (fallback)
const MODIFIER_GROUP_COLORS = {
	'Caliente/Frío': { bg: '#FFF3E0', text: '#E65100' }, // Orange for temp
	'Dosis Extra': { bg: '#F3E5F5', text: '#7B1FA2' }, // Purple for extras
	Leche: { bg: '#E3F2FD', text: '#1565C0' }, // Blue for milk
	Matcha: { bg: '#E8F5E9', text: '#388E3C' }, // Green for matcha
	Option: { bg: '#F5F5F5', text: '#757575' }, // Gray for generic
	Other: { bg: '#F5F5F5', text: '#757575' }, // Gray fallback
	Temperatura: { bg: '#FFF3E0', text: '#E65100' }, // Orange for temp
} satisfies Record<string, { bg: string; text: string }>

// Priority order for modifier groups (lower = first)
// 1. Temperature, 2. Milk type, 3. Coffee/Matcha type, 4. Extras, 5. Other
const MODIFIER_GROUP_PRIORITY: Record<string, number> = {
	Café: 3,
	'Caliente/Frío': 1,
	'Dosis Extra': 4,
	Leche: 2,
	Matcha: 3,
	Option: 5,
	Other: 6,
	Temperatura: 1,
}

// Modifier name priorities for more precise sorting within groups
const MODIFIER_NAME_PRIORITY: Record<string, number> = {
	Avena: 2,
	// Temperature (1)
	Caliente: 1,
	Ceremonial: 3,
	Deslactosada: 2,
	Doble: 4,
	// Milk types (2)
	Entera: 2,
	'Extra Caliente': 1,
	Frío: 1,
	// Coffee/Matcha types (3)
	Imperial: 3,
	Internacional: 3,
	Natural: 3,
	// Extras (4)
	'Una adicional': 4,
}

// Temperature-related modifier names
const HOT_MODIFIERS = new Set(['Caliente', 'Extra Caliente'])
const COLD_MODIFIERS = new Set(['Frío'])

export default function BaristaQueue() {
	const { t } = useLingui()
	const screenRef = useRef<ScrollView>(null)

	const [selectedCategoryId, setSelectedCategoryId] = useState<null | string>(
		null,
	)

	useScrollToTop(screenRef)

	const {
		data: orders,
		isLoading,
		refetch,
	} = useQuery(baristaQueueQueryOptions)
	const { data: products } = useQuery(productsQueryOptions)
	const { data: categories } = useQuery(categoriesQueryOptions)

	// Filter categories to only show those with products in the queue
	const availableCategories = useMemo(() => {
		// Collect all category IDs from products in the queue
		const categoryIdsInQueue = new Set<string>()
		for (const order of orders) {
			if (order.products)
				for (const product of order.products) {
					if (product.category_id) {
						categoryIdsInQueue.add(product.category_id)
					}
				}
		}

		// Filter and sort categories
		return (
			categories
				.filter((cat) => categoryIdsInQueue.has(cat.category_id))
				// eslint-disable-next-line unicorn/no-array-sort
				.sort((a, b) => a.category_name.localeCompare(b.category_name))
		)
	}, [categories, orders])

	// Poll only when screen is focused and app is active
	// useEffect(() => {
	// 	if (!isFocused) {
	// 		setIsPolling(false)
	// 		return
	// 	}

	// 	setIsPolling(true)

	// 	const interval = setInterval(() => {
	// 		void refetch()
	// 	}, POLLING_INTERVAL)

	// 	// Also handle app state changes
	// 	const subscription = AppState.addEventListener('change', (state) => {
	// 		if (state === 'active' && isFocused) {
	// 			void refetch()
	// 		}
	// 	})

	// 	return () => {
	// 		clearInterval(interval)
	// 		subscription.remove()
	// 		setIsPolling(false)
	// 	}
	// }, [isFocused, refetch])
	useFocusEffect(
		useCallback(() => {
			const interval = setInterval(() => {
				void refetch()
			}, POLLING_INTERVAL)

			return () => {
				clearInterval(interval)
			}
		}, [refetch]),
	)

	// Create a map for quick product lookup
	const productMap = useMemo(() => {
		const map = new Map<string, (typeof products)[number]>()
		for (const product of products) {
			map.set(product.product_id, product)
		}
		return map
	}, [products])

	// Create a map for category ID → category name
	const categoryMap = useMemo(() => {
		const map = new Map<string, string>()

		for (const category of categories) {
			map.set(category.category_id, category.category_name)
		}
		return map
	}, [categories])

	// Create a map for modification ID → modification name
	const modificationMap = useMemo(() => {
		const map = new Map<string, string>()

		for (const product of products) {
			// Get modifications from group_modifications
			if (product.group_modifications)
				for (const group of product.group_modifications) {
					for (const module_ of group.modifications ?? []) {
						map.set(
							String(module_.dish_modification_id),
							module_.modificator_name || module_.name,
						)
					}
				}
			// Also check direct modifications array
			if (product.modifications)
				for (const module_ of product.modifications) {
					map.set(
						String(module_.dish_modification_id),
						module_.modificator_name || module_.name,
					)
				}
		}
		return map
	}, [products])

	const handleRefresh = useCallback(() => {
		void queryClient.invalidateQueries(baristaQueueQueryOptions)
	}, [])

	// Filter orders based on selected category
	const filteredOrders = useMemo(() => {
		if (!selectedCategoryId) return orders

		// Filter orders to only include products from the selected category
		return orders
			.map((order) => ({
				...order,
				products: order.products?.filter(
					(product) => product.category_id === selectedCategoryId,
				),
			}))
			.filter((order) => order.products && order.products.length > 0)
	}, [orders, selectedCategoryId])

	return (
		<>
			<Head>
				<title>{t`Queue`}</title>
			</Head>
			<ScreenContainer
				contentContainerStyle={styles.container}
				noScroll={orders.length === 0}
				ref={screenRef}
				refreshControl={
					<RefreshControl onRefresh={handleRefresh} refreshing={isLoading} />
				}
				withTopGradient
				withTopPadding
			>
				<View style={styles.headerRow}>
					<H2>
						<Trans>Order Queue</Trans>
					</H2>
				</View>

				{/* Category filter pills */}
				{availableCategories.length > 0 && (
					<RNScrollView
						contentContainerStyle={styles.filterContent}
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.filterContainer}
					>
						<Pressable
							onPress={() => setSelectedCategoryId(null)}
							style={[
								styles.filterPill,
								!selectedCategoryId && styles.filterPillActive,
							]}
						>
							<Text
								style={[
									styles.filterPillText,
									!selectedCategoryId && styles.filterPillTextActive,
								]}
							>
								<Trans>All</Trans>
							</Text>
						</Pressable>
						{availableCategories.map((category) => {
							const isActive = selectedCategoryId === category.category_id
							const categoryColor =
								CATEGORY_COLORS[category.category_name] ||
								DEFAULT_CATEGORY_COLOR
							return (
								<Pressable
									key={category.category_id}
									onPress={() => setSelectedCategoryId(category.category_id)}
									style={[
										styles.filterPill,
										isActive && { backgroundColor: categoryColor },
									]}
								>
									<Text
										style={[
											styles.filterPillText,
											isActive && styles.filterPillTextActive,
										]}
									>
										{category.category_name}
									</Text>
								</Pressable>
							)
						})}
					</RNScrollView>
				)}

				{filteredOrders.length > 0 ? (
					<View style={styles.ordersList}>
						{filteredOrders.map((order) => {
							const isDineIn = order.service_mode === '1' || !order.service_mode
							const isTakeaway = order.service_mode === '2'
							const isDelivery = order.service_mode === '3'
							const rawTableName =
								order.table_name ||
								(order.table_id === '0' ? null : order.table_id)
							const tableLabel = rawTableName ? `Mesa ${rawTableName}` : null
							const orderDate = order.date_start || order.date_create
							const minutesElapsed = getMinutesElapsed(orderDate)
							const timeColor = getTimeColor(minutesElapsed)
							// Number of guests/clients in the order
							const guestsCount = order.guests_count ?? 0

							return (
								<Card key={order.transaction_id} style={styles.orderCard}>
									<View style={styles.orderHeader}>
										<View style={styles.orderInfo}>
											<Text style={styles.orderId} weight="bold">
												#{order.transaction_id}
											</Text>
											{/* Guests count */}
											{guestsCount > 0 && (
												<View style={styles.guestsBadge}>
													<Ionicons color="#5C6BC0" name="people" size={12} />
													<Text style={styles.guestsText}>{guestsCount}</Text>
												</View>
											)}
											{/* Dine-in with table number */}
											{isDineIn && tableLabel && (
												<View style={styles.dineInBadge}>
													<Feather color="#795548" name="coffee" size={12} />
													<Text style={styles.dineInText}>{tableLabel}</Text>
												</View>
											)}
											{/* Takeaway */}
											{isTakeaway && (
												<View style={styles.toGoBadge}>
													<Feather
														color="#007AFF"
														name="shopping-bag"
														size={12}
													/>
													<Text style={styles.toGoText}>
														<Trans>To Go</Trans>
													</Text>
												</View>
											)}
											{/* Delivery */}
											{isDelivery && (
												<View style={styles.deliveryBadge}>
													<Feather color="#9C27B0" name="truck" size={12} />
													<Text style={styles.deliveryText}>
														<Trans>Delivery</Trans>
													</Text>
												</View>
											)}
										</View>
										<View style={styles.timeContainer}>
											<Feather color={timeColor} name="clock" size={12} />
											<Text style={[styles.orderTime, { color: timeColor }]}>
												{getRelativeTime(orderDate)}
											</Text>
										</View>
									</View>

									{order.client_firstname && (
										<Text style={styles.clientName}>
											<Feather name="user" size={14} /> {order.client_firstname}{' '}
											{order.client_lastname}
										</Text>
									)}

									{order.products && order.products.length > 0 && (
										<View style={styles.productsList}>
											{[...order.products]
												// eslint-disable-next-line unicorn/no-array-reverse
												.reverse()
												.map((orderProduct, index) => {
													const productDetails = productMap.get(
														orderProduct.product_id,
													)
													// Get category name to determine color
													// Use category_id from augmented product data, or fall back to product lookup
													const categoryId =
														orderProduct.category_id ||
														productDetails?.menu_category_id
													const categoryName = categoryId
														? categoryMap.get(categoryId)
														: undefined
													const productColor = getCategoryColor(categoryName)
													const productName =
														orderProduct.product_name ||
														productDetails?.product_name ||
														`Product ${orderProduct.product_id}`

													// Get modifiers array (new API format) or fall back to legacy
													const modifiers = orderProduct.modifiers
													const legacyModifications = orderProduct.modification

													// Parse quantity - it's a string like "1" or "2"
													const count =
														Math.floor(Number(orderProduct.num)) || 1

													return (
														<View
															key={index}
															style={styles.productItemContainer}
														>
															<View style={styles.productItem}>
																<View
																	style={[
																		styles.productQuantityBadge,
																		{ backgroundColor: productColor },
																	]}
																>
																	<Text style={styles.productQuantityText}>
																		{count}
																	</Text>
																</View>
																<Text style={styles.productName}>
																	{productName}
																</Text>
															</View>
															{/* Show modifier tags from new API format (with group info) */}
															{modifiers && modifiers.length > 0 && (
																<View style={styles.modifierTagsContainer}>
																	{sortModifiers(modifiers).map(
																		(module_, moduleIndex) => {
																			const colors = getModifierColor(
																				module_.name,
																				module_.group,
																			)
																			const icon = getModifierIcon(module_.name)
																			return (
																				<View
																					key={moduleIndex}
																					style={[
																						styles.modifierTag,
																						{ backgroundColor: colors.bg },
																					]}
																				>
																					{icon && (
																						<Ionicons
																							color={icon.color}
																							name={icon.name}
																							size={12}
																						/>
																					)}
																					<Text
																						style={[
																							styles.modifierTagText,
																							{ color: colors.text },
																						]}
																					>
																						{module_.name}
																					</Text>
																				</View>
																			)
																		},
																	)}
																</View>
															)}
															{/* Fallback: Show modifications from legacy array */}
															{!modifiers?.length &&
																legacyModifications &&
																legacyModifications.length > 0 && (
																	<View style={styles.modifierTagsContainer}>
																		{legacyModifications.map(
																			(module_, moduleIndex) => {
																				const moduleName =
																					module_.modification_name ||
																					modificationMap.get(module_.m) ||
																					`Mod #${module_.m}`
																				const colors =
																					getModifierColor(moduleName)
																				return (
																					<View
																						key={moduleIndex}
																						style={[
																							styles.modifierTag,
																							{ backgroundColor: colors.bg },
																						]}
																					>
																						<Text
																							style={[
																								styles.modifierTagText,
																								{ color: colors.text },
																							]}
																						>
																							{moduleName}
																						</Text>
																					</View>
																				)
																			},
																		)}
																	</View>
																)}
														</View>
													)
												})}
										</View>
									)}

									{order.transaction_comment && (
										<View style={styles.commentContainer}>
											<Feather
												color="#8E8E93"
												name="message-square"
												size={14}
											/>
											<Text style={styles.commentText}>
												{order.transaction_comment}
											</Text>
										</View>
									)}
								</Card>
							)
						})}
					</View>
				) : (
					<View style={styles.emptyContainer}>
						<Feather color="#8E8E93" name="coffee" size={64} />
						<H3 align="center">
							<Trans>No orders in queue</Trans>
						</H3>
						<Paragraph align="center">
							<Trans>New orders will appear here</Trans>
						</Paragraph>
					</View>
				)}
			</ScreenContainer>
		</>
	)
}

/**
 * Get color based on category name
 */
function getCategoryColor(categoryName: string | undefined): string {
	if (!categoryName) return DEFAULT_CATEGORY_COLOR
	return CATEGORY_COLORS[categoryName] || DEFAULT_CATEGORY_COLOR
}

/**
 * Get minutes elapsed since the given date
 */
function getMinutesElapsed(dateString: string | undefined): number {
	const date = parseDate(dateString)
	if (!date || Number.isNaN(date.getTime())) return 0

	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	return Math.floor(diffMs / 60_000)
}

/**
 * Get color for a modifier based on name first, then group
 */
function getModifierColor(
	name: string,
	group?: string,
): { bg: string; text: string } {
	// First check by specific name
	if (name in MODIFIER_NAME_COLORS) {
		return MODIFIER_NAME_COLORS[name as keyof typeof MODIFIER_NAME_COLORS]
	}
	// Then by group
	if (group && group in MODIFIER_GROUP_COLORS) {
		return MODIFIER_GROUP_COLORS[group as keyof typeof MODIFIER_GROUP_COLORS]
	}
	// Default gray
	return { bg: '#F5F5F5', text: '#757575' }
}

/**
 * Get icon for a modifier (currently only temperature)
 */
function getModifierIcon(
	name: string,
): null | { color: string; name: 'flame' | 'snow' } {
	if (HOT_MODIFIERS.has(name)) {
		return { color: '#D32F2F', name: 'flame' }
	}
	if (COLD_MODIFIERS.has(name)) {
		return { color: '#1976D2', name: 'snow' }
	}
	return null
}

/**
 * Get relative time string (e.g., "5m", "1h 20m", "1d 2h")
 */
function getRelativeTime(dateString: string | undefined): string {
	const date = parseDate(dateString)
	if (!date || Number.isNaN(date.getTime())) return ''

	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMinutes = Math.floor(diffMs / 60_000)

	// Handle future dates (shouldn't happen but just in case)
	if (diffMinutes < 0) return 'Just now'
	if (diffMinutes < 1) return 'Just now'
	if (diffMinutes < 60) return `${diffMinutes}m`

	const hours = Math.floor(diffMinutes / 60)
	if (hours < 24) {
		const minutes = diffMinutes % 60
		if (minutes === 0) return `${hours}h`
		return `${hours}h ${minutes}m`
	}

	// More than 24 hours - show days
	const days = Math.floor(hours / 24)
	const remainingHours = hours % 24
	if (remainingHours === 0) return `${days}d`
	return `${days}d ${remainingHours}h`
}

/**
 * Get color for time based on how old the order is
 * - Normal (< 5 min): default gray
 * - Warning (5-10 min): yellow/amber
 * - Caution (10-15 min): orange
 * - Urgent (> 15 min): red
 */
function getTimeColor(minutes: number): string {
	if (minutes >= 15) return '#D32F2F' // Red
	if (minutes >= 10) return '#F57C00' // Orange
	if (minutes >= 5) return '#FFA000' // Amber/Yellow
	return '#8E8E93' // Default gray
}

/**
 * Parse date from Poster API - can be Unix timestamp (seconds) or "Y-m-d H:i:s" format
 */
function parseDate(dateValue: string | undefined): Date | null {
	if (!dateValue) return null

	// Check if it looks like a Unix timestamp (all digits, reasonable range)
	const numberValue = Number(dateValue)
	if (
		!Number.isNaN(numberValue) &&
		numberValue > 1_000_000_000 &&
		numberValue < 9_999_999_999
	) {
		// Unix timestamp in seconds
		return new Date(numberValue * 1000)
	}
	if (!Number.isNaN(numberValue) && numberValue > 9_999_999_999) {
		// Unix timestamp in milliseconds
		return new Date(numberValue)
	}

	// Format: "2023-12-25 14:30:00" - assume Mexico City timezone (UTC-6)
	const [datePart, timePart] = dateValue.split(' ')
	if (!datePart || !timePart) return null
	return new Date(`${datePart}T${timePart}-06:00`)
}

/**
 * Sort modifiers by priority: temperature → milk → coffee/matcha type → extras → other
 */
function sortModifiers(
	modifiers: { group: string; name: string }[],
): { group: string; name: string }[] {
	// eslint-disable-next-line unicorn/no-array-sort
	return [...modifiers].sort((a, b) => {
		// First try by specific modifier name
		const namePriorityA = MODIFIER_NAME_PRIORITY[a.name] ?? 99
		const namePriorityB = MODIFIER_NAME_PRIORITY[b.name] ?? 99
		if (namePriorityA !== namePriorityB) {
			return namePriorityA - namePriorityB
		}
		// Fall back to group priority
		const priorityA = MODIFIER_GROUP_PRIORITY[a.group] ?? 99
		const priorityB = MODIFIER_GROUP_PRIORITY[b.group] ?? 99
		return priorityA - priorityB
	})
}

const styles = StyleSheet.create((theme) => ({
	clientName: {
		color: theme.colors.gray.text,
		fontSize: 14,
		marginTop: theme.spacing.xs,
	},
	commentContainer: {
		alignItems: 'flex-start',
		borderTopColor: theme.colors.gray.border,
		borderTopWidth: 1,
		flexDirection: 'row',
		gap: theme.spacing.xs,
		marginTop: theme.spacing.xs,
		paddingTop: theme.spacing.sm,
	},
	commentText: {
		color: theme.colors.gray.text,
		flex: 1,
		fontSize: 13,
		fontStyle: 'italic',
	},
	container: {
		gap: theme.spacing.md,
		padding: theme.layout.screenPadding,
	},
	deliveryBadge: {
		alignItems: 'center',
		backgroundColor: '#F3E5F5',
		borderRadius: theme.borderRadius.sm,
		flexDirection: 'row',
		gap: 4,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 2,
	},
	deliveryText: {
		color: '#9C27B0',
		fontSize: 12,
		fontWeight: '600',
	},
	dineInBadge: {
		alignItems: 'center',
		backgroundColor: '#EFEBE9',
		borderRadius: theme.borderRadius.sm,
		flexDirection: 'row',
		gap: 4,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 2,
	},
	dineInText: {
		color: '#795548',
		fontSize: 12,
		fontWeight: '600',
	},
	emptyContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingVertical: theme.spacing.xxl,
	},
	filterContainer: {
		marginHorizontal: -theme.layout.screenPadding,
	},
	filterContent: {
		gap: theme.spacing.sm,
		paddingHorizontal: theme.layout.screenPadding,
	},
	filterPill: {
		backgroundColor: theme.colors.gray.background,
		borderRadius: theme.borderRadius.full,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
	},
	filterPillActive: {
		backgroundColor: theme.colors.verde.solid,
	},
	filterPillText: {
		color: theme.colors.gray.text,
		fontSize: 14,
		fontWeight: '500',
	},
	filterPillTextActive: {
		color: 'white',
	},
	guestsBadge: {
		alignItems: 'center',
		backgroundColor: '#E8EAF6', // Light indigo
		borderRadius: theme.borderRadius.sm,
		flexDirection: 'row',
		gap: 4,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 2,
	},
	guestsText: {
		color: '#5C6BC0', // Indigo
		fontSize: 12,
		fontWeight: '600',
	},
	headerRow: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	modifierTag: {
		alignItems: 'center',
		borderRadius: theme.borderRadius.sm,
		flexDirection: 'row',
		gap: theme.spacing.xs,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
	},
	modifierTagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.xs,
		marginLeft: 32, // Align with product name (badge width + gap)
	},
	modifierTagText: {
		fontSize: 14,
		fontWeight: '500',
	},
	orderCard: {
		gap: theme.spacing.sm,
	},
	orderHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	orderId: {
		fontSize: 18,
	},
	orderInfo: {
		alignItems: 'center',
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
	},
	ordersList: {
		gap: theme.spacing.md,
	},
	orderTime: {
		color: theme.colors.gray.text,
		fontSize: 13,
	},
	pollingDot: {
		backgroundColor: '#34C759',
		borderRadius: 4,
		height: 8,
		width: 8,
	},
	pollingDotActive: {
		opacity: 0.5,
	},
	pollingIndicator: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 4,
	},
	pollingText: {
		color: '#34C759',
		fontSize: 12,
		fontWeight: '600',
	},
	productItem: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
	},
	productItemContainer: {
		gap: theme.spacing.xs,
	},
	productName: {
		flex: 1,
		fontSize: 15,
		fontWeight: '600',
	},
	productQuantityBadge: {
		alignItems: 'center',
		borderRadius: 12,
		height: 24,
		justifyContent: 'center',
		minWidth: 24,
	},
	productQuantityText: {
		color: 'white',
		fontSize: 14,
		fontWeight: '700',
	},
	productsList: {
		gap: theme.spacing.sm,
		marginTop: theme.spacing.xs,
	},
	statusBadge: {
		borderRadius: theme.borderRadius.sm,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 2,
	},
	statusText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '600',
	},
	timeContainer: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.xs,
	},
	toGoBadge: {
		alignItems: 'center',
		backgroundColor: '#E3F2FD',
		borderRadius: theme.borderRadius.sm,
		flexDirection: 'row',
		gap: 4,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 2,
	},
	toGoText: {
		color: '#007AFF',
		fontSize: 12,
		fontWeight: '600',
	},
}))
