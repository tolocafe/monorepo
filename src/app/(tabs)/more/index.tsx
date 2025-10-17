import { useRef } from 'react'
import type { ScrollView } from 'react-native'
import {
	Alert,
	Linking,
	Platform,
	RefreshControl,
	TouchableOpacity,
	View,
} from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { captureException } from '@sentry/react-native'
import { useQuery } from '@tanstack/react-query'
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { List, ListItem } from '@/components/List'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Label, Paragraph } from '@/components/Text'
import WalletButton, { addPass } from '@/components/WalletButton'
import { useColorScheme } from '@/lib/hooks/use-color-scheme'
import { loadAndActivateLocale } from '@/lib/locales/load-and-activate-locale'
import { LOCALE_NAMES } from '@/lib/locales/utils'
import { selfQueryOptions } from '@/lib/queries/auth'
import { queryClient } from '@/lib/query-client'
import { getAuthToken } from '@/lib/services/http-client'
import { formatPrice } from '@/lib/utils/price'

import type { Locale } from '@/lib/locales/utils'

const AVAILABLE_LANGUAGES = Object.keys(LOCALE_NAMES) as Locale[]

const getStringOrFallback = (value: unknown, fallback: string): string =>
	typeof value === 'string' ? value : fallback

const handleSignIn = () => {
	router.push('/sign-in')
}

// Dynamic styles for Zeego dropdown components based on color scheme
const createDropdownStyles = (isDark: boolean) => ({
	content: {
		backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
		borderColor: isDark ? '#333333' : '#E0E0E0',
		borderRadius: 12,
		borderWidth: 1,
		minWidth: 160,
		padding: 4,
		shadowColor: '#000000',
		shadowOffset: { height: 2, width: 0 },
		shadowOpacity: isDark ? 0.3 : 0.1,
		shadowRadius: 8,
	},
	item: {
		borderRadius: 8,
		minHeight: 44,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	itemTitle: {
		color: isDark ? '#FFFFFF' : '#0C0C0C',
		fontFamily: 'system-ui',
		fontSize: 17,
		fontWeight: '500',
	},
	trigger: {
		backgroundColor: 'transparent',
		borderColor: isDark ? '#333333' : '#E0E0E0',
		borderRadius: 8,
		borderWidth: 0,
		marginRight: -10,
		marginVertical: -8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
})

export default function More() {
	const { i18n } = useLingui()
	const { data: user, isPending: isUserPending } = useQuery(selfQueryOptions)
	const screenRef = useRef<ScrollView>(null)
	const colorScheme = useColorScheme()
	const dropdownStyles = createDropdownStyles(colorScheme === 'dark')

	const groupName = getGroupName(user?.client_groups_name)

	const appVersion = getStringOrFallback(nativeApplicationVersion, '0')

	const buildVersion = getStringOrFallback(nativeBuildVersion, '0')

	const fullName = user
		? getFullName(user.firstname, user.lastname) || (user.name ?? '')
		: ''

	useScrollToTop(screenRef)

	styles.useVariants({ groupName })

	async function handleAddPass() {
		if (!user) {
			return
		}

		try {
			const token = await getAuthToken()

			const url = `https://app.tolo.cafe/api/passes/${user.client_id}?authenticationToken=${token}`

			await addPass(url)
		} catch (error) {
			captureException(error)

			Alert.alert(error instanceof Error ? error.message : 'Failed to add pass')
		}
	}

	return (
		<>
			<Head>
				<title>More - TOLO</title>
				<meta content="Settings and information for TOLO." name="description" />
				<meta content="More - TOLO" property="og:title" />
				<meta content="/more" property="og:url" />
			</Head>
			<ScreenContainer
				contentContainerStyle={styles.scrollContent}
				ref={screenRef}
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries(selfQueryOptions)}
						refreshing={false}
					/>
				}
				withTopGradient
				withTopPadding
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
							{Platform.OS === 'ios' && (
								<WalletButton
									onPress={handleAddPass}
									style={styles.walletButton}
								/>
							)}
						</List>
					</View>
				)}

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
								onPress={() => router.push('/more/profile')}
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

				<View style={styles.section}>
					<H2 style={styles.sectionTitle}>
						<Trans>Contact</Trans>
					</H2>

					<List>
						<ListItem
							accessibilityRole="link"
							chevron
							onPress={() => router.push('/more/visit-us')}
						>
							<ListItem.Label>
								<Trans>Stores</Trans>
							</ListItem.Label>
						</ListItem>
						<ListItem
							accessibilityRole="link"
							chevron
							onPress={() => Linking.openURL('https://tolo.cafe')}
						>
							<ListItem.Label>
								<Trans>Website</Trans>
							</ListItem.Label>
						</ListItem>
						<View style={styles.socialIconsRow}>
							<TouchableOpacity
								accessibilityRole="button"
								onPress={() => Linking.openURL('mailto:contacto@tolo.cafe')}
								style={styles.socialIcon}
							>
								<Ionicons
									color={styles.socialIcon.color}
									name="mail-outline"
									size={28}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								accessibilityRole="button"
								onPress={() =>
									Linking.openURL('https://instagram.com/tolo.cafe')
								}
								style={styles.socialIcon}
							>
								<Ionicons
									color={styles.socialIcon.color}
									name="logo-instagram"
									size={28}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								accessibilityRole="button"
								onPress={() => Linking.openURL('https://wa.me/5217229721819')}
								style={styles.socialIcon}
							>
								<Ionicons
									color={styles.socialIcon.color}
									name="logo-whatsapp"
									size={28}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								accessibilityRole="button"
								onPress={() =>
									Linking.openURL('https://www.tiktok.com/@tolo.cafe')
								}
								style={styles.socialIcon}
							>
								<Ionicons
									color={styles.socialIcon.color}
									name="logo-tiktok"
									size={28}
								/>
							</TouchableOpacity>
						</View>
					</List>
				</View>

				<View style={styles.section}>
					<H2 style={styles.sectionTitle}>
						<Trans>Settings</Trans>
					</H2>

					<List>
						<ListItem>
							<ListItem.Label>
								<Trans>Language</Trans>
							</ListItem.Label>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger style={dropdownStyles.trigger}>
									<View style={styles.languageDropdownTriggerContent}>
										<Label style={styles.languageDropdownText}>
											{LOCALE_NAMES[i18n.locale as Locale]}
										</Label>
										<Ionicons
											color={styles.languageDropdownArrow.color}
											name="chevron-down"
											size={16}
										/>
									</View>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content style={dropdownStyles.content}>
									{AVAILABLE_LANGUAGES.map((locale) => (
										<DropdownMenu.Item
											key={locale}
											onSelect={() => loadAndActivateLocale(locale)}
											style={dropdownStyles.item}
										>
											<DropdownMenu.ItemTitle style={dropdownStyles.itemTitle}>
												{LOCALE_NAMES[locale]}
											</DropdownMenu.ItemTitle>
										</DropdownMenu.Item>
									))}
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</ListItem>

						<ListItem
							accessibilityRole="link"
							chevron
							onPress={() => router.push('/more/app')}
						>
							<ListItem.Label>
								<Trans>App</Trans>
							</ListItem.Label>
						</ListItem>
					</List>
				</View>

				<View style={styles.footer}>
					<Paragraph style={styles.footerText}>
						<Trans>
							Version {appVersion} ({buildVersion})
						</Trans>
					</Paragraph>
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
	if (/^clientes?$/i.test(groupName ?? '')) {
		return 'CUSTOMER' as const
	}
	if (/^amigos y familiares$/i.test(groupName ?? '')) {
		return 'FRIEND_AND_FAMILY' as const
	}
	if (/^súper clientes?$/i.test(groupName ?? '')) {
		return 'SUPER_CUSTOMER' as const
	}
	if (/^vecinos?$/i.test(groupName ?? '')) {
		return 'NEIGHBOR' as const
	}
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
	languageDropdownArrow: {
		color: theme.colors.gray.text,
		fontSize: 12,
		marginLeft: theme.spacing.sm,
	},
	languageDropdownText: {
		flex: 1,
	},
	languageDropdownTriggerContent: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		minWidth: 120,
	},
	pendingCard: {
		paddingVertical: theme.spacing.lg,
	},
	scrollContent: {
		paddingVertical: theme.spacing.lg,
	},
	section: {
		marginBottom: theme.spacing.lg,
		paddingHorizontal: theme.layout.screenPadding,
	},
	sectionTitle: {
		marginBottom: theme.spacing.sm,
	},
	signInCard: {
		gap: theme.spacing.md,
	},
	socialIcon: {
		color: theme.colors.gray.text,
		marginHorizontal: theme.spacing.md,
	},
	socialIconsRow: {
		flexDirection: 'row',
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingBottom: theme.spacing.sm,
		paddingTop: theme.spacing.md,
	},
	topUpWalletLabel: {
		textAlign: 'center',
	},
	userInfoText: {
		textAlign: 'center',
	},
	walletButton: {
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
