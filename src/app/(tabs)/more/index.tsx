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
						refreshing={false}
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
									<DropdownMenu.Trigger style={styles.languageDropdownTrigger}>
										<View style={styles.languageDropdownTriggerContent}>
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
	languageDropdownTrigger: {},
	languageDropdownTriggerContent: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		minWidth: 120,
		paddingHorizontal: theme.spacing.md,
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
		justifyContent: 'center',
		paddingVertical: theme.spacing.sm,
	},
	userInfoText: {
		textAlign: 'center',
	},
}))
