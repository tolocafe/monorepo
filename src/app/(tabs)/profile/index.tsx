import Ionicons from '@expo/vector-icons/Ionicons'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { captureException } from '@sentry/react-native'
import { useQuery } from '@tanstack/react-query'
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import Head from 'expo-router/head'
import { useCallback, useRef, useState } from 'react'
import { Alert, Platform, Pressable, RefreshControl, View } from 'react-native'
import type { ImageSourcePropType, ScrollView } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import { List, ListItem } from '@/components/List'
import { TabScreenContainer } from '@/components/ScreenContainer'
import { H2, Paragraph, Text } from '@/components/Text'
import WalletButton, { addPass } from '@/components/WalletButton'
import { trackEvent } from '@/lib/analytics'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { resetBadgeCount } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'
import { orderQueryOptions } from '@/lib/queries/order'
import { queryClient } from '@/lib/query-client'
import { getAuthToken } from '@/lib/services/http-client'
import { useCurrentOrderItemsCount } from '@/lib/stores/order-store'
import { formatPrice } from '@/lib/utils/price'

const handleSignIn = () => {
	router.push('/sign-in')
}

const getStringOrFallback = (value: unknown, fallback: string): string =>
	typeof value === 'string' ? value : fallback

const UniImage = withUnistyles(Image)

export default function ProfileScreen() {
	const { data: user, isPending: isUserPending } = useQuery(selfQueryOptions)
	const { data: orders } = useQuery(orderQueryOptions)
	const screenRef = useRef<ScrollView>(null)
	const itemsCount = useCurrentOrderItemsCount()

	useTrackScreenView({ screenName: 'profile' }, [])
	const [isAddingPass, setIsAddingPass] = useState(false)

	const groupName = getGroupName(user?.client_groups_name)

	const appVersion = getStringOrFallback(nativeApplicationVersion, '0')
	const buildVersion = getStringOrFallback(nativeBuildVersion, '0')

	const fullName = user
		? getFullName(user.firstname, user.lastname) || (user.name ?? '')
		: ''

	useScrollToTop(screenRef)

	useFocusEffect(
		useCallback(() => {
			void resetBadgeCount()
		}, []),
	)

	styles.useVariants({ groupName })

	async function handleAddPass() {
		if (!user) return

		void trackEvent('wallet:pass_add', { platform: Platform.OS })

		try {
			setIsAddingPass(true)

			const token = await getAuthToken()

			const url = `https://app.tolo.cafe/api/passes/${user.client_id}?authenticationToken=${token}&platform=${Platform.OS}`

			if (Platform.OS === 'android') {
				const data = (await fetch(url).then((response) => response.json())) as {
					url: string
				}

				await addPass(data.url, true)
			} else {
				await addPass(url, false)
			}
		} catch (error) {
			captureException(error)

			Alert.alert(error instanceof Error ? error.message : 'Failed to add pass')
		} finally {
			setIsAddingPass(false)
		}
	}

	const recentOrders = orders?.slice(0, 3)

	if (!user && !isUserPending) {
		return (
			<>
				<Head>
					<title>{t`Profile - TOLO`}</title>
				</Head>
				<TabScreenContainer noScroll>
					<View style={styles.signInContainer}>
						<UniImage
							contentFit="contain"
							source={
								require('@/assets/images/beverages.png') as ImageSourcePropType
							}
							style={styles.image}
						/>
						<H2 style={styles.signInTitle}>
							<Trans>Sign In Required</Trans>
						</H2>
						<Paragraph style={styles.signInSubtitle}>
							<Trans>Please sign in to view your profile and orders</Trans>
						</Paragraph>
						<Button onPress={handleSignIn}>
							<Trans>Sign In</Trans>
						</Button>
					</View>
				</TabScreenContainer>
			</>
		)
	}

	return (
		<>
			<Head>
				<title>{t`Profile - TOLO`}</title>
				<meta content={t`Your profile and settings.`} name="description" />
				<meta content={t`Profile - TOLO`} property="og:title" />
				<meta content="/profile" property="og:url" />
			</Head>
			<TabScreenContainer
				ref={screenRef}
				refreshControl={
					<RefreshControl
						onRefresh={() => {
							void queryClient.invalidateQueries(selfQueryOptions)
							void queryClient.invalidateQueries(orderQueryOptions)
						}}
						refreshing={false}
					/>
				}
				withTopGradient
			>
				{user && (
					<View style={styles.section}>
						<H2 style={styles.sectionTitle}>
							<Trans>Wallet</Trans>
						</H2>

						<List style={styles.walletList}>
							<ListItem>
								<ListItem.Label>
									<Trans>Balance</Trans>
								</ListItem.Label>
								<ListItem.Text>
									{formatPrice(user.ewallet ?? '0')}
								</ListItem.Text>
							</ListItem>
							<ListItem
								accessibilityRole="link"
								centered
								onPress={() => router.push('/more/top-up')}
							>
								<ListItem.Label style={styles.topUpWalletLabel}>
									<Trans>Top Up Wallet</Trans>
								</ListItem.Label>
							</ListItem>
							{Platform.OS !== 'web' && (
								<WalletButton
									disabled={isAddingPass}
									onPress={handleAddPass}
									style={styles.walletButton}
								/>
							)}
						</List>
					</View>
				)}

				<View style={styles.section}>
					<H2 style={styles.sectionTitle}>
						<Trans>Orders</Trans>
					</H2>
					{itemsCount > 0 && (
						<Pressable
							onPress={() => router.push('/(tabs)/profile/orders/current')}
							style={styles.currentOrderCard}
						>
							<View style={styles.orderHeader}>
								<Text style={styles.currentOrderText} weight="bold">
									<Trans>Current Order</Trans>
								</Text>
								<Text style={styles.currentOrderText}>
									<Trans>{itemsCount} items</Trans>
								</Text>
							</View>
							<Text style={styles.currentOrderText}>
								<Ionicons name="chevron-forward" size={24} />
							</Text>
						</Pressable>
					)}
					<List>
						{recentOrders?.map((order) => (
							<ListItem
								accessibilityRole="link"
								chevron
								key={order.transaction_id}
								onPress={() =>
									router.push(`/(tabs)/profile/orders/${order.transaction_id}`)
								}
							>
								<ListItem.Label>
									{new Date(Number(order.date_start)).toLocaleDateString()}
								</ListItem.Label>
								<ListItem.Text>{formatPrice(order.sum)}</ListItem.Text>
							</ListItem>
						))}
						<ListItem
							accessibilityRole="link"
							centered
							onPress={() => router.push('/(tabs)/profile/orders')}
						>
							<ListItem.Label color="primary">
								<Trans>View All Orders</Trans>
							</ListItem.Label>
						</ListItem>
					</List>
				</View>

				<View style={styles.section}>
					<H2 style={styles.sectionTitle}>
						<Trans>Account</Trans>
					</H2>
					{user ? (
						<List>
							{fullName ? (
								<ListItem>
									<ListItem.Label>
										<Trans>Name</Trans>
									</ListItem.Label>
									<ListItem.Text>{fullName}</ListItem.Text>
								</ListItem>
							) : null}
							<ListItem>
								<ListItem.Label>
									<Trans>Phone</Trans>
								</ListItem.Label>
								<ListItem.Text>
									{user.phone || <Trans>Not provided</Trans>}
								</ListItem.Text>
							</ListItem>
							<ListItem
								accessibilityRole="link"
								centered
								onPress={() => router.push('/(tabs)/profile/edit')}
							>
								<ListItem.Label color="primary">
									<Trans>Edit Profile</Trans>
								</ListItem.Label>
							</ListItem>
						</List>
					) : isUserPending ? (
						<Card style={styles.pendingCard}>
							<Paragraph style={styles.userInfoText}>
								<Trans>Loading user information...</Trans>
							</Paragraph>
						</Card>
					) : null}
				</View>

				<View style={styles.footer}>
					<Paragraph style={styles.footerText}>
						<Trans>
							Version {appVersion} ({buildVersion})
						</Trans>
					</Paragraph>
				</View>
			</TabScreenContainer>
		</>
	)
}

function getFullName(
	firstname: string | undefined,
	lastname: string | undefined,
): string {
	return `${firstname ?? ''}${lastname ? ` ${lastname}` : ''}`.trim()
}

function getGroupName(groupName: string | undefined) {
	if (/^clientes?$/i.test(groupName ?? '')) return 'CUSTOMER' as const
	if (/^amigos y familiares$/i.test(groupName ?? ''))
		return 'FRIEND_AND_FAMILY' as const
	if (/^súper clientes?$/i.test(groupName ?? ''))
		return 'SUPER_CUSTOMER' as const
	if (/^vecinos?$/i.test(groupName ?? '')) return 'NEIGHBOR' as const
}

const styles = StyleSheet.create((theme) => ({
	currentOrderCard: {
		alignItems: 'center',
		backgroundColor: theme.colors.verde.solid,
		borderCurve: 'continuous',
		borderRadius: theme.borderRadius.md,
		flexDirection: 'row',
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.sm,
		padding: theme.spacing.lg,
	},
	currentOrderText: {
		color: 'white',
	},
	footer: {
		alignItems: 'center',
		paddingVertical: theme.spacing.md,
	},
	footerText: {
		color: theme.colors.gray.text,
		fontSize: theme.typography.caption.fontSize,
		textAlign: 'center',
	},
	image: {
		height: 250,
		width: 250,
	},
	orderHeader: {
		flex: 1,
		gap: theme.spacing.xs,
	},
	pendingCard: {
		paddingVertical: theme.spacing.lg,
	},
	section: {
		marginBottom: theme.spacing.lg,
	},
	sectionTitle: {
		marginBottom: theme.spacing.sm,
	},
	signInContainer: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.xxl,
	},
	signInSubtitle: {
		color: theme.colors.crema.solid,
		textAlign: 'center',
	},
	signInTitle: {
		textAlign: 'center',
	},
	topUpWalletLabel: {
		textAlign: 'center',
	},
	userInfoText: {
		textAlign: 'center',
	},
	walletButton: {
		_android: {
			minHeight: 40,
		},
		width: '100%',
	},
	walletList: {
		backgroundColor: theme.colors.gray.background,
		variants: {
			groupName: {
				CUSTOMER: {
					backgroundColor: theme.colors.gray.interactive,
				},
				FRIEND_AND_FAMILY: {
					backgroundColor: theme.colors.rojo.interactive,
				},
				NEIGHBOR: {
					backgroundColor: theme.colors.amarillo.interactive,
				},
				SUPER_CUSTOMER: {
					backgroundColor: theme.colors.verde.interactive,
				},
			},
		},
	},
}))
