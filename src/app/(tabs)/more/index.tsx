import { useRef } from 'react'
import type { ScrollView } from 'react-native'
import { Linking, Platform, Pressable, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { useScrollToTop } from '@react-navigation/native'
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { TextColorIcon } from '@/components/Icons'
import { List, ListItem } from '@/components/List'
import { TabScreenContainer } from '@/components/ScreenContainer'
import { H2, Label, Paragraph } from '@/components/Text'
import { trackEvent } from '@/lib/analytics'
import { useColorScheme } from '@/lib/hooks/use-color-scheme'
import { loadAndActivateLocale } from '@/lib/locales/load-and-activate-locale'
import { LOCALE_NAMES } from '@/lib/locales/utils'

import type { Locale } from '@/lib/locales/utils'

const AVAILABLE_LANGUAGES = Object.keys(LOCALE_NAMES) as Locale[]

const getStringOrFallback = (value: unknown, fallback: string): string =>
	typeof value === 'string' ? value : fallback

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
	const screenRef = useRef<ScrollView>(null)
	const colorScheme = useColorScheme()
	const dropdownStyles = createDropdownStyles(colorScheme === 'dark')

	const appVersion = getStringOrFallback(nativeApplicationVersion, '0')

	const buildVersion = getStringOrFallback(nativeBuildVersion, '0')

	useScrollToTop(screenRef)

	return (
		<>
			<Head>
				<title>More - TOLO</title>
				<meta content="Settings and information for TOLO." name="description" />
				<meta content="More - TOLO" property="og:title" />
				<meta content="/more" property="og:url" />
			</Head>
			<TabScreenContainer ref={screenRef} withTopGradient>
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
							<Pressable
								accessibilityRole="button"
								onPress={() => {
									void trackEvent('social:link_click', { platform: 'email' })
									void Linking.openURL('mailto:contacto@tolo.cafe')
								}}
								style={styles.socialIcon}
							>
								<Ionicons
									color={styles.socialIcon.color}
									name="mail-outline"
									size={28}
								/>
							</Pressable>
							<Pressable
								accessibilityRole="button"
								onPress={() => {
									void trackEvent('social:link_click', {
										platform: 'instagram',
									})
									void Linking.openURL('https://instagram.com/tolo.cafe')
								}}
								style={styles.socialIcon}
							>
								<Ionicons
									color={styles.socialIcon.color}
									name="logo-instagram"
									size={28}
								/>
							</Pressable>
							<Pressable
								accessibilityRole="button"
								onPress={() => {
									void trackEvent('social:link_click', { platform: 'whatsapp' })
									void Linking.openURL('https://wa.me/5217229721819')
								}}
								style={styles.socialIcon}
							>
								<Ionicons
									color={styles.socialIcon.color}
									name="logo-whatsapp"
									size={28}
								/>
							</Pressable>
							<Pressable
								accessibilityRole="button"
								onPress={() => {
									void trackEvent('social:link_click', { platform: 'tiktok' })
									void Linking.openURL('https://www.tiktok.com/@tolo.cafe')
								}}
								style={styles.socialIcon}
							>
								<Ionicons
									color={styles.socialIcon.color}
									name="logo-tiktok"
									size={28}
								/>
							</Pressable>
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
										<TextColorIcon name="chevron-down" size={16} />
									</View>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content style={dropdownStyles.content}>
									{AVAILABLE_LANGUAGES.map((locale) => (
										<DropdownMenu.Item
											key={locale}
											onSelect={() => {
												const oldLocale = i18n.locale
												void trackEvent('settings:language_change', {
													new_locale: locale,
													old_locale: oldLocale,
												})
												void loadAndActivateLocale(locale)
											}}
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
			</TabScreenContainer>
		</>
	)
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
	languageDropdownText: {
		flex: 1,
	},
	languageDropdownTriggerContent: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		minWidth: 120,
	},
	section: {
		marginBottom: theme.spacing.lg,
	},
	sectionTitle: {
		marginBottom: theme.spacing.sm,
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
}))
