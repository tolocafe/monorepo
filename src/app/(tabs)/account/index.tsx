import { useRef, useState } from 'react'
import type { ScrollView } from 'react-native'
import { Alert, Platform, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { captureException } from '@sentry/react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import Button from '@/components/Button'
import Card from '@/components/Card'
import { List, ListItem } from '@/components/List'
import { TabScreenContainer } from '@/components/ScreenContainer'
import { H2, Paragraph } from '@/components/Text'
import WalletButton, { addPass } from '@/components/WalletButton'
import { trackEvent } from '@/lib/analytics'
import { selfQueryOptions } from '@/lib/queries/auth'
import { queryClient } from '@/lib/query-client'
import { getAuthToken } from '@/lib/services/http-client'
import { formatPrice } from '@/lib/utils/price'
import { RefreshControl } from 'react-native'

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

	return
}

const handleSignIn = () => {
	router.push('/sign-in')
}

export default function Account() {
	const { data: user, isPending: isUserPending } = useQuery(selfQueryOptions)
	const screenRef = useRef<ScrollView>(null)
	const [isAddingPass, setIsAddingPass] = useState(false)

	const groupName = getGroupName(user?.client_groups_name)

	const fullName = user
		? getFullName(user.firstname, user.lastname) || (user.name ?? '')
		: ''

	useScrollToTop(screenRef)

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

	return (
		<>
			<Head>
				<title>Account - TOLO</title>
				<meta
					content="Your account information and wallet for TOLO."
					name="description"
				/>
				<meta content="Account - TOLO" property="og:title" />
				<meta content="/account" property="og:url" />
			</Head>
			<TabScreenContainer
				ref={screenRef}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries(selfQueryOptions)}
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
								onPress={() => router.push('/account/top-up')}
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
						<Trans>Profile</Trans>
					</H2>
					{user ? (
						<List>
							<ListItem
								accessibilityRole="link"
								chevron
								onPress={() => router.push('/account/orders')}
							>
								<ListItem.Label>
									<Trans>Orders</Trans>
								</ListItem.Label>
							</ListItem>
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
								onPress={() => router.push('/account/profile')}
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
					) : (
						<Card style={styles.signInCard}>
							<Paragraph style={styles.userInfoText}>
								<Trans>
									Sign in to view your account information and access
									personalized features.
								</Trans>
							</Paragraph>
							<Button onPress={handleSignIn}>
								<Trans>Sign In</Trans>
							</Button>
						</Card>
					)}
				</View>
			</TabScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	pendingCard: {
		paddingVertical: theme.spacing.lg,
	},
	section: {
		marginBottom: theme.spacing.lg,
	},
	sectionTitle: {
		marginBottom: theme.spacing.sm,
	},
	signInCard: {
		gap: theme.spacing.md,
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
