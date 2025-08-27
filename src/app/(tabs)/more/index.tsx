import { useRef } from 'react'
import type { ScrollView } from 'react-native'
import { Linking, RefreshControl, TouchableOpacity, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import HeaderGradient from '@/components/HeaderGradient'
import { List, ListItem } from '@/components/List'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Label, Paragraph } from '@/components/Text'
import { useColorScheme } from '@/lib/hooks/use-color-scheme'
import { LOCALE_NAMES } from '@/lib/locales/init'
import { loadAndActivateLocale } from '@/lib/locales/load-and-activate-locale'
import { selfQueryOptions } from '@/lib/queries/auth'
import { queryClient } from '@/lib/query-client'
import { formatPrice } from '@/lib/utils/price'

import type { Locale } from '@/lib/locales/init'

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
		minHeight: 44,
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

	const appVersion = getStringOrFallback(nativeApplicationVersion, '0')

	const buildVersion = getStringOrFallback(nativeBuildVersion, '0')

	const fullName = user
		? getFullName(user.firstname, user.lastname) || (user.name ?? '')
		: ''

	useScrollToTop(screenRef)

	return (
		<>
			<Head>
				<title>More - TOLO</title>
				<meta content="Settings and information for TOLO." name="description" />
				<meta content="More - TOLO" property="og:title" />
				<meta content="/more" property="og:url" />
			</Head>
			<HeaderGradient />
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

						<List>
							<ListItem
								label={<Trans>Balance</Trans>}
								text={formatPrice(user.ewallet ?? '0')}
							/>
							<ListItem
								accessibilityRole="link"
								centered
								label={<Trans>Top Up Wallet</Trans>}
								labelColor="primary"
								onPress={() => router.push('/more/top-up')}
							/>
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
								<ListItem label={<Trans>Name</Trans>} text={fullName} />
							) : null}
							<ListItem
								label={<Trans>Phone</Trans>}
								text={user.phone || <Trans>Not provided</Trans>}
							/>
							<ListItem
								accessibilityRole="link"
								centered
								label={<Trans>Edit Profile</Trans>}
								labelColor="primary"
								onPress={() => router.push('/more/profile')}
							/>
						</List>
					) : isUserPending ? (
						<Card>
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
							label={<Trans>Stores</Trans>}
							onPress={() => router.push('/more/visit-us')}
						/>
						<ListItem
							accessibilityRole="link"
							chevron
							label={<Trans>Website</Trans>}
							onPress={() => Linking.openURL('https://tolo.cafe')}
						/>
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
							<View style={styles.settingRow}>
								<Label style={styles.settingLabel}>
									<Trans>Language</Trans>
								</Label>
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
												<DropdownMenu.ItemTitle
													style={dropdownStyles.itemTitle}
												>
													{LOCALE_NAMES[locale]}
												</DropdownMenu.ItemTitle>
											</DropdownMenu.Item>
										))}
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</View>
						</ListItem>

						<ListItem
							accessibilityRole="link"
							chevron
							label={<Trans>App</Trans>}
							onPress={() => router.push('/more/app')}
						/>
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

const styles = StyleSheet.create((theme) => ({
	footer: {
		alignItems: 'center',
		paddingVertical: theme.spacing.md,
	},
	footerText: {
		color: theme.colors.textTertiary,
		fontSize: theme.typography.caption.fontSize,
		textAlign: 'center',
	},
	languageDropdownArrow: {
		color: theme.colors.textSecondary,
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
	settingLabel: {},
	settingRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	signInCard: {
		gap: theme.spacing.md,
	},
	signOutButtonText: {
		color: theme.colors.surface,
		fontSize: theme.typography.body.fontSize,
		fontWeight: theme.typography.body.fontWeight,
	},
	socialIcon: {
		color: theme.colors.text,
		marginHorizontal: theme.spacing.md,
	},
	socialIconsRow: {
		flexDirection: 'row',
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingTop: theme.spacing.md,
	},
	userInfoText: {
		textAlign: 'center',
	},
}))
