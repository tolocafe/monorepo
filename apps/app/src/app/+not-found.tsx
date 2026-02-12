import '@/lib/styles/unistyles'
import { Trans, useLingui } from '@lingui/react/macro'
import { Link, Stack } from 'expo-router'
import Head from 'expo-router/head'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { Text, H1 } from '@/components/Text'

export default function NotFoundScreen() {
	const { t } = useLingui()

	return (
		<>
			<Head>
				<title>{t`Page Not Found - TOLO`}</title>
				<meta
					content={t`Oops, this page doesn't exist. Return to TOLO to enjoy our good coffee and discover everything we have for you.`}
					name="description"
				/>
				<meta content="noindex, nofollow" name="robots" />
			</Head>
			<Stack.Screen.Title>{t`Oops!`}</Stack.Screen.Title>
			<View style={styles.container}>
				<H1 style={styles.title}>
					<Trans>This screen does not exist.</Trans>
				</H1>
				<Link href="/" style={styles.link}>
					<Text style={styles.linkText}>
						<Trans>Go to home screen!</Trans>
					</Text>
				</Link>
			</View>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	container: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		flex: 1,
		justifyContent: 'center',
		padding: theme.layout.screenPadding,
	},
	link: {
		marginTop: theme.spacing.md,
		paddingVertical: theme.spacing.md,
	},
	linkText: {
		color: theme.colors.primary.solid,
		fontSize: theme.fontSizes.md,
	},
	title: {
		color: theme.colors.gray.text,
		fontSize: theme.fontSizes.xl,
		fontWeight: theme.fontWeights.bold,
	},
}))
