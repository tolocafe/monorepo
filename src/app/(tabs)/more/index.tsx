import { Linking, RefreshControl, TouchableOpacity, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { List, ListItem } from '@/components/List'
import { ScreenContainer } from '@/components/ScreenContainer'
import { H2, Label, Paragraph } from '@/components/Text'
import { useLanguage } from '@/lib/contexts/language-context'
import { selfQueryOptions } from '@/lib/queries/auth'
import { queryClient } from '@/lib/query-client'
import { formatPrice } from '@/lib/utils/price'

const getStringOrFallback = (value: unknown, fallback: string): string =>
	typeof value === 'string' ? value : fallback

const handleSignIn = () => {
	router.push('/sign-in')
}

export default function More() {
	const { changeLanguage, currentLanguage } = useLanguage()
	const { data: user, isPending: isUserPending } = useQuery(selfQueryOptions)

	const appVersion = getStringOrFallback(nativeApplicationVersion, '0')

	const buildVersion = getStringOrFallback(nativeBuildVersion, '0')

	const fullName = user
		? getFullName(user.firstname, user.lastname) || (user.name ?? '')
		: ''

	// moved Clear Cache to /more/app screen

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
				refreshControl={
					<RefreshControl
						onRefresh={() => queryClient.invalidateQueries(selfQueryOptions)}
						refreshing={isUserPending}
					/>
				}
			>
				{/* User Information Section */}
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
								label={<Trans>Wallet</Trans>}
								text={formatPrice(user.ewallet ?? '0')}
							/>
							{/* <ListItem
								accessibilityRole="link"
								centered
								label={<Trans>Top Up Wallet</Trans>}
								labelColor="primary"
								onPress={() => router.push('/more/top-up')}
							/> */}
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
						<Card>
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
								onPress={() => Linking.openURL('https://wa.me/14155551234')}
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
									<DropdownMenu.Trigger asChild>
										<View style={styles.languageDropdownTrigger}>
											<Label style={styles.languageDropdownText}>
												{currentLanguage === 'en' ? 'English' : 'Español'}
											</Label>
											<Ionicons
												color={styles.languageDropdownArrow.color}
												name="chevron-down"
												size={16}
											/>
										</View>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content>
										<DropdownMenu.Item
											key="en"
											onSelect={() => changeLanguage('en')}
										>
											<DropdownMenu.ItemTitle>English</DropdownMenu.ItemTitle>
										</DropdownMenu.Item>
										<DropdownMenu.Item
											key="es"
											onSelect={() => changeLanguage('es')}
										>
											<DropdownMenu.ItemTitle>Español</DropdownMenu.ItemTitle>
										</DropdownMenu.Item>
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
	button: {
		alignItems: 'center',
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		marginTop: theme.spacing.lg,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
	},
	buttonText: {
		color: theme.colors.surface,
		fontSize: theme.typography.body.fontSize,
		fontWeight: theme.typography.body.fontWeight,
	},
	card: {
		// Deprecated; using <Card> component instead. Kept for potential spacing overrides.
	},
	cardText: {
		color: theme.colors.textSecondary,
		fontSize: theme.typography.body.fontSize,
		lineHeight: 22,
		marginBottom: theme.spacing.xs,
	},
	cardTitle: {
		fontSize: theme.typography.h3.fontSize,
		fontWeight: theme.typography.h3.fontWeight,
		marginBottom: theme.spacing.xs,
	},
	caret: {
		color: theme.colors.textSecondary,
		fontSize: 30,
		marginLeft: theme.spacing.sm,
	},
	centerLink: {
		alignItems: 'center',
		paddingVertical: theme.spacing.md,
	},
	centerLinkText: {
		color: theme.colors.primary,
	},
	clearCacheButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		marginBottom: theme.spacing.sm,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
	},
	clearCacheButtonDisabled: {
		backgroundColor: theme.colors.border,
	},
	clearCacheDescription: {
		color: theme.colors.textSecondary,
		fontSize: theme.typography.caption.fontSize,
		lineHeight: 18,
		textAlign: 'center',
	},
	clearCacheText: {
		color: theme.colors.surface,
		fontSize: theme.typography.body.fontSize,
		fontWeight: theme.typography.body.fontWeight,
	},
	clearCacheTextDisabled: {
		color: theme.colors.textSecondary,
	},
	contactButton: {
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius.sm,
		marginBottom: theme.spacing.xs,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.md,
	},
	contactButtonText: {
		color: theme.colors.primary,
		fontSize: theme.typography.body.fontSize,
		fontWeight: theme.typography.body.fontWeight,
		textAlign: 'center',
	},

	dayText: {
		fontSize: theme.typography.body.fontSize,
	},
	footer: {
		alignItems: 'center',
		paddingVertical: theme.spacing.md,
	},
	footerText: {
		color: theme.colors.textSecondary,
		fontSize: theme.typography.caption.fontSize,
		textAlign: 'center',
	},
	hoursContainer: {
		marginBottom: theme.spacing.sm,
		marginTop: theme.spacing.lg,
	},
	hoursRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: theme.spacing.xs,
	},
	hoursText: {
		color: theme.colors.textSecondary,
		fontSize: theme.typography.body.fontSize,
	},
	hoursTitle: {
		...theme.typography.h4,
		color: theme.colors.text,
		marginBottom: theme.spacing.sm,
	},
	languageDropdownArrow: {
		color: theme.colors.textSecondary,
		fontSize: 12,
		marginLeft: theme.spacing.sm,
	},
	languageDropdownText: {
		flex: 1,
	},
	languageDropdownTrigger: {
		alignItems: 'center',
		flexDirection: 'row',
		minWidth: 120,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
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
	settingDivider: {
		backgroundColor: theme.colors.border,
		height: 1,
		marginVertical: 0,
	},
	settingLabel: {},
	settingRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	signInButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
	},
	signInButtonText: {
		color: theme.colors.surface,
		fontSize: theme.typography.body.fontSize,
		fontWeight: theme.typography.body.fontWeight,
	},
	signOutButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		marginTop: theme.spacing.sm,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
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
		justifyContent: 'center',
		paddingVertical: theme.spacing.sm,
	},
	// User Information Styles
	userInfo: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: theme.spacing.sm,
	},
	userInfoDivider: {
		backgroundColor: theme.colors.border,
		height: 1,
		marginVertical: theme.spacing.xs,
	},
	userInfoError: {
		alignItems: 'center',
		paddingVertical: theme.spacing.lg,
	},
	userInfoLabel: {
		flex: 1,
	},
	userInfoLoading: {
		alignItems: 'center',
		paddingVertical: theme.spacing.lg,
	},
	userInfoText: {
		textAlign: 'center',
	},
	userInfoValue: {
		color: theme.colors.textSecondary,
		flex: 2,
		fontSize: theme.typography.body.fontSize,
		textAlign: 'right',
	},
}))
