import { Linking, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import ScreenContainer from '@/components/ScreenContainer'
import { H3, Label, Text } from '@/components/Text'

const APPLE_MAPS_URL = 'https://maps.apple/p/97fTAIvUnQ-uSU'
const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/V9Uz531Jz94ziYDn9'
const TRIPADVISOR_URL =
	'https://www.tripadvisor.com/Restaurant_Review-g644384-d33287081-Reviews-Tolo_Buen_Cafe-Toluca_Central_Mexico_and_Gulf_Coast.html?m=69573'

export default function VisitUs() {
	const { t } = useLingui()

	return (
		<>
			<Head>
				<title>{t`Visit Us - TOLO Good Coffee`}</title>
				<meta
					content={t`Come visit TOLO. Find our hours, address and quick links to your preferred maps app.`}
					name="description"
				/>
				<meta content={t`Visit Us - TOLO Good Coffee`} property="og:title" />
				<meta content="/more/visit-us" property="og:url" />
			</Head>
			<ScreenContainer>
				<View style={styles.section}>
					<Card>
						<Text style={styles.cardTitle}>
							<Trans>TOLO - Good Coffee</Trans>
						</Text>
						<Label style={styles.cardText}>
							<Trans>Boulevard José María Pino Suárez 800</Trans>
						</Label>
						<Label style={styles.cardText}>
							<Trans>Altamirano, 50130 Toluca, Edo. Méx., Mexico</Trans>
						</Label>

						<View style={styles.hoursContainer}>
							<H3 style={styles.hoursTitle}>
								<Trans>Hours</Trans>
							</H3>
							<View style={styles.hoursRow}>
								<Label style={styles.dayText}>
									<Trans>Monday – Friday</Trans>
								</Label>
								<Label style={styles.hoursText}>
									<Trans>9:00 AM – 5:00 PM</Trans>
								</Label>
							</View>
							<View style={styles.hoursRow}>
								<Label style={styles.dayText}>
									<Trans>Saturday</Trans>
								</Label>
								<Label style={styles.hoursText}>
									<Trans>Closed</Trans>
								</Label>
							</View>
							<View style={styles.hoursRow}>
								<Label style={styles.dayText}>
									<Trans>Sunday</Trans>
								</Label>
								<Label style={styles.hoursText}>
									<Trans>Closed</Trans>
								</Label>
							</View>
						</View>

						<View style={styles.actions}>
							<Button
								accessibilityLabel={t`Open location in Apple Maps`}
								onPress={handleOpenAppleMaps}
							>
								<Trans>Apple Maps</Trans>
							</Button>
							<Button
								accessibilityLabel={t`Open location in Google Maps`}
								onPress={handleOpenGoogleMaps}
								variant="surface"
							>
								<Trans>Google Maps</Trans>
							</Button>
							<Button
								accessibilityLabel={t`View on TripAdvisor`}
								onPress={handleOpenTripAdvisor}
								variant="surface"
							>
								<Trans>TripAdvisor</Trans>
							</Button>
						</View>
					</Card>
				</View>
			</ScreenContainer>
		</>
	)
}

function handleOpenAppleMaps(): void {
	void Linking.openURL(APPLE_MAPS_URL)
}

function handleOpenGoogleMaps(): void {
	void Linking.openURL(GOOGLE_MAPS_URL)
}

function handleOpenTripAdvisor(): void {
	void Linking.openURL(TRIPADVISOR_URL)
}

const styles = StyleSheet.create((theme) => ({
	actions: {
		gap: theme.spacing.sm,
		marginTop: theme.spacing.md,
	},
	cardText: {
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
	},
	cardTitle: {
		marginBottom: theme.spacing.xs,
	},
	dayText: {},
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
	},
	hoursTitle: {
		...theme.typography.h4,
		marginBottom: theme.spacing.sm,
	},
	section: {
		marginBottom: theme.spacing.lg,
		padding: theme.layout.screenPadding,
	},
	sectionTitle: {
		marginBottom: theme.spacing.sm,
	},
}))
