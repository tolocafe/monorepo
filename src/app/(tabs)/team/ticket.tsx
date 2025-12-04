import { useCallback, useState } from 'react'
import { Alert, View } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import Head from 'expo-router/head'
import { StyleSheet } from 'react-native-unistyles'

import { Button } from '@/components/Button'
import Input from '@/components/Input'
import ScreenContainer from '@/components/ScreenContainer'
import { H2, Paragraph } from '@/components/Text'
import { useIsBarista } from '@/lib/hooks/use-is-barista'
import { downloadReceipt } from '@/lib/utils/download-receipt'

export default function TeamTicketDownload() {
	const { t } = useLingui()
	const isBarista = useIsBarista()
	const [ticketId, setTicketId] = useState<string>('')
	const [isDownloading, setIsDownloading] = useState(false)

	const canDownload = isBarista && ticketId.trim().length > 0

	const handleDownload = useCallback(async () => {
		if (!canDownload) return
		try {
			setIsDownloading(true)
			await downloadReceipt(ticketId.trim())
		} catch {
			Alert.alert(t`Error`, t`Failed to download receipt. Please try again.`, [
				{ text: t`OK` },
			])
		} finally {
			setIsDownloading(false)
		}
	}, [canDownload, ticketId, t])

	if (!isBarista) {
		return (
			<>
				<Head>
					<title>{t`Not Authorized`}</title>
				</Head>
				<ScreenContainer withTopGradient withTopPadding>
					<View style={styles.centered}>
						<H2>
							<Trans>Not Authorized</Trans>
						</H2>
						<Paragraph style={styles.helperText}>
							<Trans>You need barista or owner access to use this tool.</Trans>
						</Paragraph>
					</View>
				</ScreenContainer>
			</>
		)
	}

	return (
		<>
			<Head>
				<title>{t`Download Ticket PDF`}</title>
			</Head>
			<ScreenContainer withTopGradient withTopPadding>
				<View style={styles.section}>
					<H2 style={styles.title}>
						<Trans>Download Ticket PDF</Trans>
					</H2>
					<Paragraph style={styles.helperText}>
						<Trans>
							Enter a ticket number and download its receipt as PDF.
						</Trans>
					</Paragraph>
					<View style={styles.form}>
						<Input
							autoCapitalize="none"
							autoCorrect={false}
							editable={!isDownloading}
							keyboardType="number-pad"
							onChangeText={setTicketId}
							placeholder={t`Ticket number`}
							returnKeyType="done"
							value={ticketId}
						/>
						<Button
							disabled={!canDownload || isDownloading}
							onPress={handleDownload}
						>
							{isDownloading ? (
								<Trans>Downloading...</Trans>
							) : (
								<Trans>Download PDF</Trans>
							)}
						</Button>
					</View>
				</View>
			</ScreenContainer>
		</>
	)
}

const styles = StyleSheet.create((theme) => ({
	centered: {
		alignItems: 'center',
		flex: 1,
		gap: theme.spacing.md,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.lg,
	},
	form: {
		gap: theme.spacing.md,
		marginTop: theme.spacing.md,
	},
	helperText: {
		color: theme.colors.crema.solid,
	},
	section: {
		gap: theme.spacing.xs,
		paddingHorizontal: theme.layout.screenPadding,
	},
	title: {
		marginBottom: theme.spacing.xs,
	},
}))
