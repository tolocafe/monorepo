import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { captureException } from '@sentry/react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { Image } from 'expo-image'
import { router, Stack, useFocusEffect } from 'expo-router'
import Head from 'expo-router/head'
import { useCallback, useRef, useState } from 'react'
import { Alert, Linking, Platform, RefreshControl, View } from 'react-native'
import type { ImageSourcePropType, ScrollView } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import { List, ListItem } from '@/components/List'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Paragraph } from '@/components/Text'
import WalletButton, { addPass } from '@/components/WalletButton'
import { trackEvent } from '@/lib/analytics'
import { useTrackScreenView } from '@/lib/analytics/hooks'
import { resetBadgeCount } from '@/lib/notifications'
import { selfQueryOptions, signOutMutationOptions } from '@/lib/queries/auth'
import { clearAllCache } from '@/lib/queries/cache-utils'
import { orderQueryOptions } from '@/lib/queries/order'
import { queryClient } from '@/lib/query-client'
import { getAuthToken } from '@/lib/services/http-client'
import { formatPrice } from '@/lib/utils/price'

const handleSignIn = () => {
	router.push('/sign-in')
}

const UniImage = withUnistyles(Image)

export default function ProfileScreen() {
	const { data: user, isPending: isUserPending } = useQuery(selfQueryOptions)
	const { data: orders } = useQuery(orderQueryOptions)
	const screenRef = useRef<ScrollView>(null)

	useTrackScreenView({ screenName: 'profile' }, [])
	const [isAddingPass, setIsAddingPass] = useState(false)

	const groupName = getGroupName(user?.client_groups_name)

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

	const { mutateAsync: signOut } = useMutation(signOutMutationOptions)

	const handleSignOut = async () => {
		async function signOutPress() {
			await signOut().catch((error: unknown) => {
				captureException(error)

				Burnt.toast({
					duration: 3,
					haptic: 'error',
					message: t`Error signing out. Please try again.`,
					preset: 'error',
					title: t`Error`,
				})
			})

			await clearAllCache()

			if (router.canGoBack()) {
				router.back()
			} else {
				router.navigate('/(tabs)/profile', { withAnchor: false })
			}
		}

		if (Platform.OS === 'web') {
			await signOutPress()
		} else {
			Alert.alert(t`Sign Out`, t`Are you sure you want to sign out?`, [
				{ style: 'cancel', text: t`Cancel` },
				{
					onPress: signOutPress,
					style: 'destructive',
					text: t`Sign Out`,
				},
			])
		}
	}

	if (!user && !isUserPending) {
		return (
			<>
				<Head>
					<title>{t`Profile - TOLO`}</title>
				</Head>
				<ScreenContainer noScroll>
					<View style={styles.signInContainer}>
						<UniImage
							contentFit="contain"
							source={
								require('@/assets/images/surprise.png') as ImageSourcePropType
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
				</ScreenContainer>
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
			<Stack.Screen.Title>{t`Profile`}</Stack.Screen.Title>
			<ScreenContainer
				refreshControl={
					<RefreshControl
						onRefresh={() => {
							void queryClient.invalidateQueries(selfQueryOptions)
							void queryClient.invalidateQueries(orderQueryOptions)
						}}
						refreshing={false}
					/>
				}
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
								onPress={() => router.push('/profile/top-up')}
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
						<>
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
							<View style={styles.separator} />
							<List>
								<ListItem
									accessibilityRole="link"
									chevron
									onPress={() => router.push('/(tabs)/profile/sessions')}
								>
									<ListItem.Label>
										<Trans>Sessions</Trans>
									</ListItem.Label>
								</ListItem>
								<ListItem
									accessibilityRole="link"
									chevron
									onPress={() =>
										Linking.openURL('https://www.tolo.cafe/eliminar')
									}
								>
									<ListItem.Label>
										<Trans>Delete</Trans>
									</ListItem.Label>
								</ListItem>
								<ListItem chevron onPress={handleSignOut}>
									<ListItem.Label>
										<Trans>Sign Out</Trans>
									</ListItem.Label>
								</ListItem>
							</List>
						</>
					) : isUserPending ? (
						<Card style={styles.pendingCard}>
							<Paragraph style={styles.userInfoText}>
								<Trans>Loading user information...</Trans>
							</Paragraph>
						</Card>
					) : null}
				</View>
			</ScreenContainer>
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
	pendingCard: {
		paddingVertical: theme.spacing.lg,
	},
	section: {
		marginBottom: theme.spacing.lg,
	},
	sectionTitle: {
		marginBottom: theme.spacing.sm,
	},
	separator: {
		height: theme.spacing.md,
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
		color: theme.colors.gray.solid,
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
					backgroundColor: theme.colors.error.interactive,
				},
				NEIGHBOR: {
					backgroundColor: theme.colors.amarillo.interactive,
				},
				SUPER_CUSTOMER: {
					backgroundColor: theme.colors.primary.interactive,
				},
			},
		},
	},
}))
