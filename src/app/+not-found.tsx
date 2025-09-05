import '@/lib/styles/unistyles'

import { View } from 'react-native'

import { Link, Stack } from 'expo-router'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { H1, Text } from '@/components/Text'

export default function NotFoundScreen() {
	return (
		<>
			<Head>
				<title>Página No Encontrada - TOLO</title>
				<meta
					content="Oops, esta página no existe. Regresa a TOLO para disfrutar de nuestro buen café y descubrir todo lo que tenemos para ti."
					name="description"
				/>
				<meta content="noindex, nofollow" name="robots" />
			</Head>
			<Stack.Screen options={{ title: 'Oops!' }} />
			<View style={styles.container}>
				<H1 style={styles.title}>This screen does not exist.</H1>
				<Link href="/" style={styles.link}>
					<Text style={styles.linkText}>Go to home screen!</Text>
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
		color: theme.colors.verde.solid,
		fontSize: theme.fontSizes.md,
	},
	title: {
		color: theme.colors.gray.text,
		fontSize: theme.fontSizes.xl,
		fontWeight: theme.fontWeights.bold,
	},
}))
